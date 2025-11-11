from langchain_core.tools import tool
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import asyncpg
import json
from config import get_settings

settings = get_settings()

def parse_date(date_str: Optional[str]) -> Optional[date]:
    """Convert YYYY-MM-DD string to date object for asyncpg"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

async def get_client_db_pool():
    """Get connection pool to client_data database"""
    return await asyncpg.create_pool(
        host=settings.client_data_host,
        port=settings.client_data_port,
        user=settings.client_data_user,
        password=settings.client_data_password,
        database=settings.client_data_db,
        min_size=1,
        max_size=5
    )

async def get_vector_db_pool():
    """Get connection pool to main_db (vector database)"""
    return await asyncpg.create_pool(
        host=settings.postgres_host,
        port=settings.postgres_port,
        user=settings.postgres_user,
        password=settings.postgres_password,
        database=settings.postgres_db,
        min_size=1,
        max_size=5
    )

def create_product_search_tool(queries_executed: List[Dict]):
    """Tool to search products by name using vector similarity"""
    
    @tool
    async def search_products(query: str, top_n: int = 5) -> str:
        """
        Search for products by name or description using semantic search.
        
        Args:
            query: Product name or description to search for (e.g. "tortillas de nopal", "salsa picante")
            top_n: Number of results to return (default 5, max 20)
        
        Returns:
            List of matching products with their IDs, names, brands, and categories
        """
        from tools.vector_search import VectorSearchTool
        
        top_n = min(max(1, top_n), 20)  # Clamp between 1-20
        
        vector_tool = VectorSearchTool()
        result = await vector_tool.search_product(query, top_n)
        
        queries_executed.append({
            "type": "vector_search",
            "database": "main_db",
            "target": "products",
            "search_term": query,
            "top_n": top_n,
            "source": "simple_agent_tool"
        })
        
        if result.get("success") and result.get("data"):
            products = result["data"]
            response = f"Found {len(products)} product(s):\n\n"
            for p in products:
                response += f"- ID: {p['product_id']}, Name: {p['product_name']}, Brand: {p.get('brand', 'N/A')}, Category: {p.get('category', 'N/A')}\n"
            return response
        else:
            return f"No products found matching '{query}'"
    
    return search_products


def create_client_group_search_tool(queries_executed: List[Dict]):
    """Tool to search for client groups"""
    
    @tool
    async def search_client_groups(query: str) -> str:
        """
        Search for client groups by name to get the EXACT group name.
        
        **WHEN TO USE:**
        - User mentions "grupo", "group" followed by a name
        - Before calling get_sales_summary or get_backorders_summary with client_group
        - Examples: "grupo Xtra", "grupo Super", "grupo Retail"
        
        **CRITICAL:** This tool is REQUIRED before filtering by client_group!
        The database has exact group names that may differ from what user says.
        
        **WORKFLOW:**
        1. User says: "ventas del grupo Xtra"
        2. Call: search_client_groups(query="Xtra")
        3. Get result: "GRUPO XTRA" (exact name)
        4. Call: get_sales_summary(client_group="GRUPO XTRA")
        
        Args:
            query: Group name or partial name to search (e.g., "Xtra", "Super", "Retail")
        
        Returns:
            List of matching client groups with exact names and statistics.
            USE THE EXACT GROUP NAME from results in subsequent queries.
        """
        sql = """
            SELECT 
                c.client_group,
                COUNT(DISTINCT c.client_id) as client_count,
                COUNT(DISTINCT c.city) as cities
            FROM clients c
            WHERE c.client_group IS NOT NULL
                AND c.client_group ILIKE $1
            GROUP BY c.client_group
            ORDER BY client_count DESC
            LIMIT 10
        """
        
        # Add wildcards for partial matching
        search_pattern = f"%{query}%"
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [search_pattern],
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, search_pattern)
                
                if not rows:
                    return f"No client groups found matching '{query}'. Try a different search term."
                
                response = f"Found {len(rows)} client group(s) matching '{query}':\n\n"
                for row in rows:
                    response += f"- Group: '{row['client_group']}' ({row['client_count']} clients, {row['cities']} cities)\n"
                
                response += f"\n💡 Use the exact group name (in quotes) when filtering by client_group"
                return response
        finally:
            await pool.close()
    
    return search_client_groups


def create_inventory_tool(queries_executed: List[Dict]):
    """Tool to query inventory levels"""
    
    @tool
    async def query_inventory(
        product_id: Optional[str] = None,
        location_id: Optional[str] = None,
        top_n: int = 20
    ) -> str:
        """
        Get current inventory levels.
        
        Args:
            product_id: Specific product ID to filter (optional)
            location_id: Specific location ID to filter (optional)
            top_n: Number of results to return (default 20)
        
        Returns:
            Current inventory levels by product and location
        """
        conditions = []
        params = []
        param_counter = 1
        
        if product_id:
            conditions.append(f"i.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if location_id:
            conditions.append(f"i.location_id = ${param_counter}")
            params.append(location_id)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        sql = f"""
            SELECT 
                p.product_name,
                p.brand,
                p.category,
                i.inventory_qty,
                l.location_name,
                l.city
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            JOIN locations l ON i.location_id = l.location_id
            {where_clause}
            ORDER BY i.inventory_qty DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return "No inventory data found"
                
                response = f"Found {len(rows)} inventory record(s):\n\n"
                for row in rows:
                    response += f"- {row['product_name']} ({row['brand']}): {row['inventory_qty']} units at {row['location_name']} ({row['city']})\n"
                return response
        finally:
            await pool.close()
    
    return query_inventory


def create_sales_tool(queries_executed: List[Dict]):
    """Tool to query sales data"""
    
    @tool
    async def query_sales(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        client_id: Optional[str] = None,
        top_n: int = 20
    ) -> str:
        """
        Get sales transaction data with optional filters.
        
        Args:
            start_date: Start date in YYYY-MM-DD format (default: 30 days ago)
            end_date: End date in YYYY-MM-DD format (default: today)
            product_id: Specific product ID to filter (optional)
            client_id: Specific client ID to filter (optional)
            top_n: Number of results to return (default 20)
        
        Returns:
            Sales records matching the criteria
        """
        conditions = ["t.transaction_type = 'SALE'"]  # Only sales transactions
        params = []
        param_counter = 1
        
        # Parse date strings to date objects
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"t.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            conditions.append("t.date >= CURRENT_DATE - INTERVAL '30 days'")
        
        if end_date_obj:
            conditions.append(f"t.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"t.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if client_id:
            conditions.append(f"t.client_id = ${param_counter}")
            params.append(client_id)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        sql = f"""
            SELECT 
                DATE(t.date) as transaction_date,
                p.product_name,
                p.brand,
                c.client_name,
                c.client_group,
                t.quantity,
                t.unit_price,
                t.gross_amount,
                t.net_amount,
                t.discount_amount,
                t.seller_name
            FROM transactions t
            JOIN products p ON t.product_id = p.product_id
            JOIN clients c ON t.client_id = c.client_id
            {where_clause}
            ORDER BY t.date DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return "No sales data found for the specified criteria"
                
                total_amount = sum(float(row['net_amount']) for row in rows)
                
                response = f"Found {len(rows)} sale(s), Total Net: ${total_amount:,.2f}\n\n"
                for row in rows[:10]:  # Show first 10
                    response += f"- {row['transaction_date']}: {row['product_name']} ({row['brand']}) → {row['client_name']}, Qty: {row['quantity']}, Net: ${float(row['net_amount']):,.2f}, Seller: {row['seller_name']}\n"
                
                if len(rows) > 10:
                    response += f"\n...and {len(rows) - 10} more records"
                
                return response
        finally:
            await pool.close()
    
    return query_sales


def create_backorders_tool(queries_executed: List[Dict]):
    """Tool to query backorder data"""
    
    @tool
    async def query_backorders(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        top_n: int = 20
    ) -> str:
        """
        Get INDIVIDUAL backorder records (limited sample, NOT for totals).
        
        ⚠️ WARNING: This tool shows ONLY a SAMPLE of records (top_n). The totals shown 
        are ONLY for the sample, NOT the full database total.
        
        **USE THIS TOOL WHEN:**
        - User wants to see SPECIFIC backorder records
        - "Lista de backorders" (wants list of individual items)
        - "Muéstrame algunos backorders" (wants examples/details)
        - "Cuáles productos tienen backorder" (wants specific product names)
        
        **DO NOT USE for (use get_backorders_summary instead):**
        - "Dame el backorder" (wants TOTAL)
        - "Total de backorders" (wants SUM)
        - "¿Cuánto backorder hay?" (wants complete totals)
        - "Backorder de los últimos X meses" (wants aggregated total)
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-06-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-06-30")
            product_id: Specific product ID to filter (optional)
            top_n: Number of sample records to return (default 20)
        
        Returns:
            Text with list of sample backorder records (NOT complete totals)
        """
        conditions = []
        params = []
        param_counter = 1
        
        # Parse date strings to date objects
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"b.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            conditions.append("b.date >= CURRENT_DATE - INTERVAL '90 days'")
        
        if end_date_obj:
            conditions.append(f"b.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"b.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        sql = f"""
            SELECT 
                b.date,
                b.order_id,
                p.product_name,
                p.brand,
                p.category,
                b.backorder_qty,
                b.unit_price,
                (b.backorder_qty * b.unit_price) as backorder_value,
                b.order_qty,
                b.delivery_qty,
                l.location_name,
                l.city,
                c.client_name,
                b.seller_name
            FROM backorder b
            JOIN products p ON b.product_id = p.product_id
            JOIN locations l ON b.location_id = l.location_id
            JOIN clients c ON b.client_id = c.client_id
            {where_clause}
            ORDER BY b.date DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return "No backorders found for the specified criteria"
                
                # Calculate sample totals (only for these limited records)
                sample_qty = sum(row['backorder_qty'] for row in rows)
                sample_value = sum(float(row['backorder_value']) for row in rows)
                
                response = f"⚠️ SHOWING SAMPLE OF {len(rows)} RECORDS (not complete totals)\n"
                response += f"Sample Qty: {sample_qty:,.2f}, Sample Value: ${sample_value:,.2f}\n"
                response += f"⚠️ Use get_backorders_summary to get COMPLETE TOTALS\n\n"
                
                for row in rows[:10]:
                    response += f"- Order #{row['order_id']} ({row['date']}): {row['product_name']} ({row['brand']}), Qty: {row['backorder_qty']}, Value: ${float(row['backorder_value']):,.2f}\n"
                    response += f"  Client: {row['client_name']}, Location: {row['location_name']} ({row['city']}), Seller: {row['seller_name']}\n"
                
                if len(rows) > 10:
                    response += f"\n...and {len(rows) - 10} more records"
                
                return response
        finally:
            await pool.close()
    
    return query_backorders


# ============================================================================
# AGGREGATED TOOLS - For totals and summaries (NO limits)
# ============================================================================

def create_backorders_summary_tool(queries_executed: List[Dict]):
    """Tool to get aggregated backorder summary (totals, no limit)"""
    
    @tool
    async def get_backorders_summary(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        client_group: Optional[str] = None
    ) -> str:
        """
        Get COMPLETE TOTAL backorder metrics (SUM of ALL records, no limits).
        
        ✅ This tool calculates the TRUE TOTALS from the entire database.
        
        **USE THIS TOOL WHEN:**
        - "Dame el backorder" (wants TOTAL)
        - "¿Cuánto backorder hay?" (wants complete quantity/value)
        - "Total de backorders de junio" (wants complete aggregate)
        - "Backorder de los últimos 3 meses" (wants full totals)
        - "Resumen de backorders" (wants summary with totals)
        - "Backorder del grupo X" (wants backorders by client group)
        
        **DO NOT USE for (use query_backorders instead):**
        - "Lista de backorders" (wants list of individual records)
        - "Muéstrame los backorders" (wants specific examples)
        - "Cuáles productos tienen backorder" (wants product names)
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super", "Retail"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        2. Example:
           - User says: "backorder del grupo Xtra"
           - Step 1: search_client_groups(query="Xtra") → returns "GRUPO XTRA"
           - Step 2: get_backorders_summary(client_group="GRUPO XTRA")
        
        **IMPORTANT:**
        - Use `client_group` ONLY with the EXACT group name from search_client_groups
        - NEVER guess the client_group name - always search first!
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-06-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-06-30")
            product_id: Specific product ID to filter (optional)
            client_group: EXACT client group name from search_client_groups (optional)
        
        Returns:
            JSON with total_quantity, total_value, record_count, top_products (complete totals)
        """
        conditions = []
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"b.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            conditions.append("b.date >= CURRENT_DATE - INTERVAL '90 days'")
        
        if end_date_obj:
            conditions.append(f"b.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"b.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        # NEW: Support for filtering by client_group
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # Join with clients table if filtering by client_group
        client_join = "JOIN clients c ON b.client_id = c.client_id" if client_group else ""
        
        # Get totals
        sql_totals = f"""
            SELECT 
                COUNT(*) as record_count,
                SUM(b.backorder_qty) as total_quantity,
                SUM(b.backorder_qty * b.unit_price) as total_value,
                SUM(b.order_qty) as total_ordered,
                SUM(b.delivery_qty) as total_delivered
            FROM backorder b
            {client_join}
            {where_clause}
        """
        
        # Get top 10 products by quantity
        sql_top_products = f"""
            SELECT 
                p.product_name,
                p.brand,
                SUM(b.backorder_qty) as total_qty,
                SUM(b.backorder_qty * b.unit_price) as total_value
            FROM backorder b
            JOIN products p ON b.product_id = p.product_id
            {client_join}
            {where_clause}
            GROUP BY p.product_name, p.brand
            ORDER BY total_qty DESC
            LIMIT 10
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql_totals,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                # Get totals
                totals = await conn.fetchrow(sql_totals, *params)
                
                # Get top products
                top_products = await conn.fetch(sql_top_products, *params)
                
                # Build human-readable response instead of JSON
                record_count = int(totals['record_count']) if totals['record_count'] is not None else 0
                total_quantity = float(totals['total_quantity']) if totals['total_quantity'] is not None else 0.0
                total_value = float(totals['total_value']) if totals['total_value'] is not None else 0.0
                total_ordered = float(totals['total_ordered']) if totals['total_ordered'] is not None else 0.0
                total_delivered = float(totals['total_delivered']) if totals['total_delivered'] is not None else 0.0
                
                response = "✅ COMPLETE TOTALS (all records in database):\n\n"
                response += f"📊 Records Found: {record_count:,}\n"
                response += f"📦 Total Backorder Quantity: {total_quantity:,.2f}\n"
                response += f"💰 Total Backorder Value: ${total_value:,.2f}\n"
                response += f"📝 Total Ordered: {total_ordered:,.2f}\n"
                response += f"🚚 Total Delivered: {total_delivered:,.2f}\n\n"
                
                if top_products:
                    response += "🏆 Top 10 Products by Backorder Quantity:\n\n"
                    for idx, row in enumerate(top_products, 1):
                        qty = float(row['total_qty']) if row['total_qty'] is not None else 0.0
                        value = float(row['total_value']) if row['total_value'] is not None else 0.0
                        response += f"{idx}. {row['product_name']} ({row['brand']})\n"
                        response += f"   Qty: {qty:,.2f}, Value: ${value:,.2f}\n"
                
                return response
        finally:
            await pool.close()
    
    return get_backorders_summary


def create_sales_summary_tool(queries_executed: List[Dict]):
    """Tool to get aggregated sales summary (totals, no limit)"""
    
    @tool
    async def get_sales_summary(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        client_id: Optional[str] = None,
        client_group: Optional[str] = None
    ) -> str:
        """
        Get TOTAL AGGREGATED sales metrics for a PERIOD (ONE SINGLE TOTAL, not broken down by time).
        
        ⚠️ CRITICAL: This tool returns ONE TOTAL NUMBER for the entire period, NOT broken down by months/weeks/days.
        
        **USE THIS TOOL WHEN:**
        - User asks "Total de ventas de enero a octubre" (wants ONE TOTAL for the range)
        - "¿Cuánto vendimos en junio?" (wants ONE number for June)
        - "Dame el total de ventas del año" (wants ONE grand total)
        - "Resumen de ventas del trimestre" (wants ONE aggregate)
        - "Ventas del grupo X en 2025" (wants ONE total by client group)
        
        **DO NOT USE when user asks for breakdown by time periods:**
        - "Ventas mes a mes" → use get_sales_by_month instead
        - "Ventas de cada mes" → use get_sales_by_month instead
        - "Comparar ventas por mes" → use get_sales_by_month instead
        - "Ventas mensuales desde enero hasta octubre" → use get_sales_by_month instead
        - "Dame las ventas desglosadas por mes" → use get_sales_by_month instead
        
        **Also DO NOT USE for:**
        - "Lista de ventas" → use query_sales instead
        - "Muéstrame transacciones" → use query_sales instead
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super", "Retail"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        2. Example:
           - User says: "ventas del grupo Xtra"
           - Step 1: search_client_groups(query="Xtra") → returns "GRUPO XTRA"
           - Step 2: get_sales_summary(client_group="GRUPO XTRA")
        
        **IMPORTANT:**
        - Use `client_id` for a SPECIFIC CLIENT CODE (e.g., client_id='C12345')
        - Use `client_group` ONLY with the EXACT group name from search_client_groups
        - NEVER guess the client_group name - always search first!
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            product_id: Specific product ID to filter (optional)
            client_id: Specific client ID to filter by individual client (optional)
            client_group: EXACT client group name from search_client_groups (optional)
        
        Returns:
            JSON with total_quantity, total_amount, record_count, top_products, top_clients
        """
        conditions = ["t.transaction_type = 'SALE'"]
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"t.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            conditions.append("t.date >= CURRENT_DATE - INTERVAL '30 days'")
        
        if end_date_obj:
            conditions.append(f"t.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"t.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if client_id:
            conditions.append(f"t.client_id = ${param_counter}")
            params.append(client_id)
            param_counter += 1
        
        # NEW: Support for filtering by client_group
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        # Join with clients table if filtering by client_group
        client_join = "JOIN clients c ON t.client_id = c.client_id" if client_group else ""
        
        # Get totals
        sql_totals = f"""
            SELECT 
                COUNT(*) as record_count,
                SUM(t.quantity) as total_quantity,
                SUM(t.gross_amount) as total_gross,
                SUM(t.net_amount) as total_net,
                SUM(t.discount_amount) as total_discounts,
                SUM(t.unit_cost * t.quantity) as total_cost
            FROM transactions t
            {client_join}
            {where_clause}
        """
        
        # Top products
        sql_top_products = f"""
            SELECT 
                p.product_name,
                p.brand,
                SUM(t.quantity) as total_qty,
                SUM(t.net_amount) as total_amount
            FROM transactions t
            JOIN products p ON t.product_id = p.product_id
            {client_join}
            {where_clause}
            GROUP BY p.product_name, p.brand
            ORDER BY total_amount DESC
            LIMIT 10
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql_totals,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                totals = await conn.fetchrow(sql_totals, *params)
                top_products = await conn.fetch(sql_top_products, *params)
                
                result = {
                    "record_count": int(totals['record_count']) if totals['record_count'] is not None else 0,
                    "total_quantity": int(totals['total_quantity']) if totals['total_quantity'] is not None else 0,
                    "total_gross": float(totals['total_gross']) if totals['total_gross'] is not None else 0.0,
                    "total_net": float(totals['total_net']) if totals['total_net'] is not None else 0.0,
                    "total_discounts": float(totals['total_discounts']) if totals['total_discounts'] is not None else 0.0,
                    "total_cost": float(totals['total_cost']) if totals['total_cost'] is not None else 0.0,
                    "top_products": [
                        {
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "quantity": int(row['total_qty']) if row['total_qty'] is not None else 0,
                            "amount": float(row['total_amount']) if row['total_amount'] is not None else 0.0
                        }
                        for row in top_products
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_summary


def create_sales_by_month_tool(queries_executed: List[Dict]):
    """Tool to get sales grouped by month"""
    
    @tool
    async def get_sales_by_month(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        client_group: Optional[str] = None
    ) -> str:
        """
        Get sales metrics GROUPED BY MONTH - returns SEPARATE totals for EACH MONTH (time series).
        
        ⚠️ CRITICAL: Use this tool when user wants to see data for EACH MONTH SEPARATELY, not just one total.
        
        **ALWAYS USE THIS TOOL WHEN user mentions:**
        - "mes a mes" (month by month)
        - "cada mes" (each month)
        - "por mes" (by month)
        - "mensuales" (monthly)
        - "mensual" (monthly)
        - "desglosadas por mes" (broken down by month)
        - "comparar meses" (compare months)
        - "de enero a octubre mes a mes"
        - "ventas de cada uno de los meses"
        
        **EXAMPLES WHERE YOU MUST USE THIS TOOL:**
        - "Dame las ventas netas totales desde enero hasta octubre del año 2025 mes a mes" ✅
        - "Ventas mensuales de 2025" ✅
        - "¿Cuánto vendí cada mes de enero a junio?" ✅
        - "Comparar ventas de cada mes del trimestre" ✅
        - "Necesito ver las ventas por mes del año" ✅
        
        **DO NOT USE when user wants just ONE TOTAL:**
        - "Total de ventas de enero a octubre" → use get_sales_summary instead
        - "¿Cuánto vendimos en el año?" → use get_sales_summary instead
        
        **DO NOT USE for individual transactions:**
        - "Lista de ventas" → use query_sales instead
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-01-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-10-31")
            product_id: Specific product ID to filter (optional)
            client_group: EXACT client group name from search_client_groups (optional)
        
        Returns:
            Text with sales metrics for each month in the date range
        """
        conditions = ["t.transaction_type = 'SALE'"]
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"t.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            conditions.append("t.date >= CURRENT_DATE - INTERVAL '12 months'")
        
        if end_date_obj:
            conditions.append(f"t.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"t.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        # Join with clients table if filtering by client_group
        client_join = "JOIN clients c ON t.client_id = c.client_id" if client_group else ""
        
        # Query to get sales grouped by month
        sql = f"""
            SELECT 
                DATE_TRUNC('month', t.date) as month,
                COUNT(*) as record_count,
                SUM(t.quantity) as total_quantity,
                SUM(t.gross_amount) as total_gross,
                SUM(t.net_amount) as total_net,
                SUM(t.discount_amount) as total_discounts,
                SUM(t.unit_cost * t.quantity) as total_cost
            FROM transactions t
            {client_join}
            {where_clause}
            GROUP BY DATE_TRUNC('month', t.date)
            ORDER BY month ASC
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"error": "No se encontraron ventas para el período especificado", "months": []})
                
                # Build structured JSON response (more efficient than formatted text)
                months_data = []
                
                for row in rows:
                    month_date = row['month']
                    
                    months_data.append({
                        "year": month_date.year,
                        "month": month_date.month,
                        "month_name": month_date.strftime("%B"),  # Full month name in English
                        "record_count": int(row['record_count']) if row['record_count'] is not None else 0,
                        "total_quantity": float(row['total_quantity']) if row['total_quantity'] is not None else 0.0,
                        "total_gross": float(row['total_gross']) if row['total_gross'] is not None else 0.0,
                        "total_net": float(row['total_net']) if row['total_net'] is not None else 0.0,
                        "total_discounts": float(row['total_discounts']) if row['total_discounts'] is not None else 0.0,
                        "total_cost": float(row['total_cost']) if row['total_cost'] is not None else 0.0
                    })
                
                # Calculate grand totals
                grand_total_net = sum(m['total_net'] for m in months_data)
                grand_total_gross = sum(m['total_gross'] for m in months_data)
                
                result = {
                    "months": months_data,
                    "summary": {
                        "total_months": len(months_data),
                        "grand_total_net": grand_total_net,
                        "grand_total_gross": grand_total_gross
                    }
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_by_month


def create_inventory_summary_tool(queries_executed: List[Dict]):
    """Tool to get aggregated inventory summary (totals, no limit)"""
    
    @tool
    async def get_inventory_summary(
        product_id: Optional[str] = None,
        location_id: Optional[str] = None
    ) -> str:
        """
        Get TOTAL AGGREGATED inventory metrics (SUM of all records, no limits).
        
        **USE THIS TOOL WHEN:**
        - User asks "¿Cuánto inventario tengo?" (wants total)
        - "Total de inventario" (wants aggregate)
        - "Dame el inventario de tortillas" (wants sum)
        - "Stock total" (wants summary)
        
        **DO NOT USE for:**
        - "Lista de inventario por bodega" → use query_inventory instead
        - "Muéstrame dónde tengo inventario" → use query_inventory instead
        
        Args:
            product_id: Specific product ID to filter (optional)
            location_id: Specific location ID to filter (optional)
        
        Returns:
            JSON with total_quantity, location_count, top_products
        """
        conditions = []
        params = []
        param_counter = 1
        
        if product_id:
            conditions.append(f"i.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if location_id:
            conditions.append(f"i.location_id = ${param_counter}")
            params.append(location_id)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # Get totals
        sql_totals = f"""
            SELECT 
                COUNT(DISTINCT i.location_id) as location_count,
                COUNT(DISTINCT i.product_id) as product_count,
                SUM(i.inventory_qty) as total_quantity
            FROM inventory i
            {where_clause}
        """
        
        # Top products by quantity
        sql_top_products = f"""
            SELECT 
                p.product_name,
                p.brand,
                p.category,
                SUM(i.inventory_qty) as total_qty
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            {where_clause}
            GROUP BY p.product_name, p.brand, p.category
            ORDER BY total_qty DESC
            LIMIT 10
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql_totals,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                totals = await conn.fetchrow(sql_totals, *params)
                top_products = await conn.fetch(sql_top_products, *params)
                
                result = {
                    "location_count": int(totals['location_count']) if totals['location_count'] is not None else 0,
                    "product_count": int(totals['product_count']) if totals['product_count'] is not None else 0,
                    "total_quantity": int(totals['total_quantity']) if totals['total_quantity'] is not None else 0,
                    "top_products": [
                        {
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "category": row['category'],
                            "quantity": int(row['total_qty']) if row['total_qty'] is not None else 0
                        }
                        for row in top_products
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_inventory_summary


# ============================================================================
# BUDGET TOOLS
# ============================================================================

def create_budgets_summary_tool(queries_executed: List[Dict]):
    """Tool to get aggregated budget summary (totals, no limit)"""
    
    @tool
    async def get_budgets_summary(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        customer_id: Optional[str] = None,
        client_group: Optional[str] = None
    ) -> str:
        """
        Get TOTAL AGGREGATED budget metrics (SUM of all budgets, no limits).
        
        **USE THIS TOOL WHEN:**
        - User asks "¿Cuánto es el presupuesto?" (wants total budget)
        - "Presupuesto total de septiembre" (wants budget aggregate)
        - "Dame el presupuesto del grupo X" (wants budget by group)
        - "Presupuesto de junio 2025" (wants budget sum)
        
        **DO NOT USE for:**
        - "Lista de presupuestos" → use query_budgets instead
        - "Muéstrame presupuestos por cliente" → use query_budgets instead
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        
        **IMPORTANT:**
        - Use `customer_id` for a SPECIFIC CLIENT (e.g., customer_id='C12345')
        - Use `client_group` ONLY with the EXACT group name from search_client_groups
        - Budget dates are stored as first day of month (e.g., '2025-09-01' for September)
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-09-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-09-30")
            customer_id: Specific customer ID to filter (optional)
            client_group: EXACT client group name from search_client_groups (optional)
        
        Returns:
            Text with total budget, record count, and top customers
        """
        conditions = []
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"b.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        
        if end_date_obj:
            conditions.append(f"b.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if customer_id:
            conditions.append(f"b.customer_id = ${param_counter}")
            params.append(customer_id)
            param_counter += 1
        
        # NEW: Support for filtering by client_group
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # Join with clients table if filtering by client_group
        client_join = "JOIN clients c ON b.customer_id = c.client_id" if client_group else ""
        
        # Get totals
        sql_totals = f"""
            SELECT 
                COUNT(*) as record_count,
                SUM(b.budget) as total_budget,
                COUNT(DISTINCT b.customer_id) as customer_count,
                MIN(b.date) as earliest_date,
                MAX(b.date) as latest_date
            FROM budgets b
            {client_join}
            {where_clause}
        """
        
        # Get top customers by budget
        sql_top_customers = f"""
            SELECT 
                c.client_name,
                c.client_group,
                SUM(b.budget) as total_budget,
                COUNT(*) as months_count
            FROM budgets b
            JOIN clients c ON b.customer_id = c.client_id
            {where_clause.replace('b.customer_id', 'b.customer_id') if not client_group else where_clause}
            GROUP BY c.client_name, c.client_group
            ORDER BY total_budget DESC
            LIMIT 10
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql_totals,
            "params": params,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                # Get totals
                totals = await conn.fetchrow(sql_totals, *params)
                
                # Get top customers
                top_customers = await conn.fetch(sql_top_customers, *params)
                
                # Build human-readable response
                record_count = int(totals['record_count']) if totals['record_count'] is not None else 0
                total_budget = float(totals['total_budget']) if totals['total_budget'] is not None else 0.0
                customer_count = int(totals['customer_count']) if totals['customer_count'] is not None else 0
                
                response = "✅ PRESUPUESTOS - TOTALES COMPLETOS:\n\n"
                response += f"📊 Registros Encontrados: {record_count:,}\n"
                response += f"💰 Presupuesto Total: ${total_budget:,.2f}\n"
                response += f"👥 Clientes con Presupuesto: {customer_count:,}\n"
                
                if totals['earliest_date'] and totals['latest_date']:
                    response += f"📅 Período: {totals['earliest_date'].strftime('%Y-%m-%d')} a {totals['latest_date'].strftime('%Y-%m-%d')}\n"
                
                if top_customers:
                    response += "\n🏆 Top 10 Clientes por Presupuesto:\n\n"
                    for idx, row in enumerate(top_customers, 1):
                        budget = float(row['total_budget']) if row['total_budget'] is not None else 0.0
                        months = int(row['months_count']) if row['months_count'] is not None else 0
                        group = row['client_group'] or 'N/A'
                        response += f"{idx}. {row['client_name']} ({group})\n"
                        response += f"   Presupuesto: ${budget:,.2f}, Meses: {months}\n"
                
                return response
        finally:
            await pool.close()
    
    return get_budgets_summary

