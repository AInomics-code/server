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
    async def search_products(query: str, top_n: int = 1) -> str:
        """
        Search for products by name or description using semantic search.
        
        Args:
            query: Product name or description to search for (e.g. "tortillas de nopal", "salsa picante")
            top_n: Number of results to return (default 1, max 20). Use 1 for specific product searches.
        
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


def create_location_search_tool(queries_executed: List[Dict]):
    """Tool to search locations by name using vector similarity"""
    
    @tool
    async def search_locations(query: str, top_n: int = 1) -> str:
        """
        Search for locations/warehouses/bodegas/sucursales by name using semantic search.
        
        **CRITICAL:** This tool is REQUIRED before filtering by location_id!
        
        **SPANISH SYNONYMS:** In Spanish, "sucursal", "bodega", and "location" are synonyms - all refer to warehouses/branches.
        
        **WHEN TO USE:**
        - User mentions a location/warehouse/bodega/sucursal name
        - Before calling get_sales_summary or other tools with location_id
        - Examples: 
          * "ventas de la sucursal de Santiago"
          * "bodega Central"
          * "ventas en Valparaíso"
          * "sucursal Norte"
        
        **WORKFLOW:**
        1. User says: "ventas de enero en la sucursal de Santiago" (or "bodega de Santiago")
        2. Call: search_locations(query="Santiago")
        3. Get result with location_id, location_name, city
        4. Call: get_sales_summary(start_date="2025-01-01", end_date="2025-01-31", location_id="<location_id_from_step_3>")
        5. Respond to user with ONLY the sales information
        
        **IMPORTANT:**
        - DO NOT mention to the user that you searched for the location
        - DO NOT show the search results to the user
        - Use the location_id silently and respond directly with the requested information
        
        Args:
            query: Location name or city to search (e.g., "Santiago", "Bodega Central", "Valparaíso", "Sucursal Norte")
            top_n: Number of results to return (default 1, max 20). Use 1 for specific location searches.
        
        Returns:
            List of matching locations with their IDs, names, and cities.
            USE THE EXACT location_id from results in subsequent queries.
            DO NOT show this search result to the user - use it silently.
        """
        from tools.vector_search import VectorSearchTool
        
        top_n = min(max(1, top_n), 20)  # Clamp between 1-20
        
        vector_tool = VectorSearchTool()
        result = await vector_tool.search_locations(query, top_n)
        
        queries_executed.append({
            "type": "vector_search",
            "database": "main_db",
            "target": "locations",
            "search_term": query,
            "top_n": top_n,
            "source": "simple_agent_tool"
        })
        
        if result.get("success") and result.get("data"):
            locations = result["data"]
            response = f"Found {len(locations)} location(s):\n\n"
            for loc in locations:
                city_info = f", City: {loc.get('city', 'N/A')}" if loc.get('city') else ""
                response += f"- ID: {loc['location_id']}, Name: {loc['location_name']}{city_info}\n"
            return response
        else:
            return f"No locations found matching '{query}'"
    
    return search_locations


def create_client_search_tool(queries_executed: List[Dict]):
    """Tool to search for individual clients by name"""
    
    @tool
    async def search_clients(query: str, top_n: int = 10) -> str:
        """
        Search for INDIVIDUAL CLIENTS by name to get the EXACT client_id.
        
        **WHEN TO USE:**
        - User mentions a specific company/client name
        - Before calling get_sales_summary or other tools with client_id
        - Examples: "ventas de PRODUCTOS ALIMENTICIOS PASCUAL", "cliente Coca Cola"
        
        **CRITICAL:** This tool is REQUIRED before filtering by client_id!
        The database has exact client IDs that you need to retrieve.
        
        **WORKFLOW:**
        1. User says: "ventas de PRODUCTOS ALIMENTICIOS PASCUAL en octubre"
        2. Call: search_clients(query="PRODUCTOS ALIMENTICIOS PASCUAL")
        3. Get result JSON with client_id, client_name, client_group, city
        4. Call: get_sales_summary(client_id="<client_id_from_step_3>")
        5. Respond to user with ONLY the sales information, DO NOT mention the search results
        
        **IMPORTANT:**
        - DO NOT mention to the user that you searched for the client
        - DO NOT show the search results to the user
        - Use the client_id silently and respond directly with the requested information
        
        **DO NOT CONFUSE WITH:**
        - search_client_groups: Use that for GROUP names like "Grupo Xtra", "Grupo Super"
        - search_clients: Use this for INDIVIDUAL CLIENT/COMPANY names
        
        Args:
            query: Client name or partial name to search (e.g., "PASCUAL", "Coca Cola")
            top_n: Number of results to return (default 10, max 20)
        
        Returns:
            JSON with list of matching clients (client_id, name, group, city).
            USE THE EXACT client_id from results in subsequent queries.
            DO NOT show this search result to the user - use it silently.
        """
        top_n = min(max(1, top_n), 20)  # Clamp between 1-20
        
        sql = """
            SELECT 
                c.client_id,
                c.client_name,
                c.client_group,
                c.city,
                c.state,
                c.country
            FROM clients c
            WHERE c.client_name ILIKE $1
            ORDER BY c.client_name
            LIMIT $2
        """
        
        # Add wildcards for partial matching
        search_pattern = f"%{query}%"
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [search_pattern, top_n],
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, search_pattern, top_n)
                
                if not rows:
                    return json.dumps({
                        "found": False,
                        "error": f"No clients found matching '{query}'",
                        "clients": []
                    })
                
                # Build JSON response
                clients = []
                for row in rows:
                    clients.append({
                        "client_id": row['client_id'],
                        "client_name": row['client_name'],
                        "client_group": row['client_group'] if row['client_group'] else None,
                        "city": row['city'] if row['city'] else None,
                        "state": row['state'] if row['state'] else None,
                        "country": row['country'] if row['country'] else None
                    })
                
                result = {
                    "found": True,
                    "total_clients": len(clients),
                    "clients": clients
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return search_clients


def create_client_group_search_tool(queries_executed: List[Dict]):
    """Tool to search for client groups"""
    
    @tool
    async def search_client_groups(query: str) -> str:
        """
        Search for CLIENT GROUPS by name to get the EXACT group name.
        
        **WHEN TO USE:**
        - User mentions "grupo", "group" followed by a name
        - Before calling get_sales_summary or get_backorders_summary with client_group
        - Examples: "grupo Xtra", "grupo Super", "grupo Retail"
        
        **DO NOT USE for individual client/company names:**
        - For specific companies like "PRODUCTOS ALIMENTICIOS PASCUAL" → use search_clients instead
        
        **CRITICAL:** This tool is REQUIRED before filtering by client_group!
        The database has exact group names that may differ from what user says.
        
        **WORKFLOW:**
        1. User says: "ventas del grupo Xtra"
        2. Call: search_client_groups(query="Xtra")
        3. Get result JSON with "GRUPO XTRA" (exact name)
        4. Call: get_sales_summary(client_group="GRUPO XTRA")
        5. Respond to user with ONLY the sales information, DO NOT mention the search results
        
        **IMPORTANT:**
        - DO NOT mention to the user that you searched for the group
        - DO NOT show the search results to the user
        - Use the exact group name silently and respond directly with the requested information
        
        Args:
            query: Group name or partial name to search (e.g., "Xtra", "Super", "Retail")
        
        Returns:
            JSON with list of matching client groups with exact names and statistics.
            USE THE EXACT GROUP NAME from results in subsequent queries.
            DO NOT show this search result to the user - use it silently.
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
                    return json.dumps({
                        "found": False,
                        "error": f"No client groups found matching '{query}'",
                        "groups": []
                    })
                
                # Build JSON response
                groups = []
                for row in rows:
                    groups.append({
                        "client_group": row['client_group'],
                        "client_count": int(row['client_count']),
                        "cities": int(row['cities'])
                    })
                
                result = {
                    "found": True,
                    "total_groups": len(groups),
                    "groups": groups
                }
                
                return json.dumps(result)
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
                b.total as backorder_value,
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
                SUM(b.total) as total_value,
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
                SUM(b.total) as total_value
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
                
                # Build structured JSON response so the agent can format it in the user's language
                record_count = int(totals['record_count']) if totals['record_count'] is not None else 0
                total_quantity = float(totals['total_quantity']) if totals['total_quantity'] is not None else 0.0
                total_value = float(totals['total_value']) if totals['total_value'] is not None else 0.0
                total_ordered = float(totals['total_ordered']) if totals['total_ordered'] is not None else 0.0
                total_delivered = float(totals['total_delivered']) if totals['total_delivered'] is not None else 0.0
                
                # Build top products list
                top_products_list = []
                if top_products:
                    for row in top_products:
                        qty = float(row['total_qty']) if row['total_qty'] is not None else 0.0
                        value = float(row['total_value']) if row['total_value'] is not None else 0.0
                        top_products_list.append({
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "quantity": qty,
                            "value": value
                        })
                
                result = {
                    "record_count": record_count,
                    "total_quantity": total_quantity,
                    "total_value": total_value,
                    "total_ordered": total_ordered,
                    "total_delivered": total_delivered,
                    "top_products": top_products_list
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_backorders_summary


def create_backorders_by_month_tool(queries_executed: List[Dict]):
    """Tool to get backorders grouped by month"""
    
    @tool
    async def get_backorders_by_month(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        client_group: Optional[str] = None
    ) -> str:
        """
        Get backorder metrics GROUPED BY MONTH - returns SEPARATE totals for EACH MONTH (time series).
        
        ⚠️ CRITICAL: Use this tool when user wants to see backorder data for EACH MONTH SEPARATELY, not just one total.
        
        ⚠️ PRESENTATION REQUIREMENT: When using this tool, you MUST show ALL months individually in your response.
        DO NOT just summarize. Present EACH MONTH ON A SEPARATE LINE using bullet points or line breaks.
        
        **ALWAYS USE THIS TOOL WHEN user mentions:**
        - "backorder mes a mes" (backorder month by month)
        - "backorder cada mes" (backorder each month)
        - "backorder por mes" (backorder by month)
        - "backorders mensuales" (monthly backorders)
        - "backorder mensual" (monthly backorder)
        - "backorder desglosado por mes" (backorder broken down by month)
        - "comparar backorders por mes" (compare backorders by month)
        - "backorder de enero a octubre mes a mes"
        
        **EXAMPLES WHERE YOU MUST USE THIS TOOL:**
        - "Dame el backorder mes a mes de este año" ✅
        - "Backorders mensuales de 2025" ✅
        - "¿Cuánto backorder hubo cada mes de enero a junio?" ✅
        - "Comparar backorder de cada mes del trimestre" ✅
        - "Necesito ver el backorder por mes del año" ✅
        
        **DO NOT USE when user wants just ONE TOTAL:**
        - "Total de backorder de enero a octubre" → use get_backorders_summary instead
        - "¿Cuánto backorder hay en el año?" → use get_backorders_summary instead
        
        **DO NOT USE for individual backorder records:**
        - "Lista de backorders" → use query_backorders instead
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-01-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-12-31")
            product_id: Specific product ID to filter (optional)
            client_group: EXACT client group name from search_client_groups (optional)
        
        Returns:
            JSON with backorder metrics for each month in the date range
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
            conditions.append("b.date >= CURRENT_DATE - INTERVAL '12 months'")
        
        if end_date_obj:
            conditions.append(f"b.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"b.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # Join with clients table if filtering by client_group
        client_join = "JOIN clients c ON b.client_id = c.client_id" if client_group else ""
        
        # Query to get backorders grouped by month
        sql = f"""
            SELECT 
                DATE_TRUNC('month', b.date) as month,
                COUNT(*) as record_count,
                SUM(b.backorder_qty) as total_quantity,
                SUM(b.total) as total_value,
                SUM(b.order_qty) as total_ordered,
                SUM(b.delivery_qty) as total_delivered
            FROM backorder b
            {client_join}
            {where_clause}
            GROUP BY DATE_TRUNC('month', b.date)
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
                    return json.dumps({"error": "No se encontraron backorders para el período especificado", "months": []})
                
                # Build structured JSON response
                months_data = []
                
                for row in rows:
                    month_date = row['month']
                    
                    months_data.append({
                        "year": month_date.year,
                        "month": month_date.month,
                        "month_name": month_date.strftime("%B"),  # Full month name in English
                        "record_count": int(row['record_count']) if row['record_count'] is not None else 0,
                        "total_quantity": float(row['total_quantity']) if row['total_quantity'] is not None else 0.0,
                        "total_value": float(row['total_value']) if row['total_value'] is not None else 0.0,
                        "total_ordered": float(row['total_ordered']) if row['total_ordered'] is not None else 0.0,
                        "total_delivered": float(row['total_delivered']) if row['total_delivered'] is not None else 0.0
                    })
                
                # Calculate grand totals
                grand_total_quantity = sum(m['total_quantity'] for m in months_data)
                grand_total_value = sum(m['total_value'] for m in months_data)
                
                result = {
                    "months": months_data,
                    "summary": {
                        "total_months": len(months_data),
                        "grand_total_quantity": grand_total_quantity,
                        "grand_total_value": grand_total_value
                    }
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_backorders_by_month


def create_sales_summary_tool(queries_executed: List[Dict]):
    """Tool to get aggregated sales summary (totals, no limit)"""
    
    @tool
    async def get_sales_summary(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_id: Optional[str] = None,
        client_id: Optional[str] = None,
        client_group: Optional[str] = None,
        location_id: Optional[str] = None
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
        - "¿Cuánto fue la venta en dólares y cantidades de [producto]?" (wants ONE total for a specific product)
        - "Ventas de [producto] de enero a diciembre" (wants ONE total for product in period)
        
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
        
        **CRITICAL WORKFLOW FOR SPECIFIC PRODUCTS:**
        1. If user mentions a product name (e.g., "Sazonador completo", "Mayonesa"):
           → FIRST call search_products(query="Sazonador completo") to get the product_id
           → THEN use the product_id returned in product_id parameter
        2. Example:
           - User says: "¿cuánto fue la venta de Sazonador completo de enero a diciembre?"
           - Step 1: search_products(query="Sazonador completo") → returns product_id='0154-SACOM160G'
           - Step 2: get_sales_summary(start_date="2025-01-01", end_date="2025-12-31", product_id="0154-SACOM160G")
        
        **CRITICAL WORKFLOW FOR SPECIFIC LOCATIONS:**
        1. If user mentions a location/warehouse/bodega/sucursal (e.g., "Santiago", "Bodega Central", "Sucursal Norte"):
           → FIRST call search_locations(query="Santiago") to get the location_id
           → THEN use the location_id returned in location_id parameter
        2. **SPANISH SYNONYMS:** "sucursal", "bodega", and "location" are synonyms - all mean warehouse/branch
        3. Example:
           - User says: "¿cuánto fue la venta de enero a diciembre en la sucursal de Santiago?"
           - Step 1: search_locations(query="Santiago") → returns location_id='LOC-SANTIAGO-01'
           - Step 2: get_sales_summary(start_date="2025-01-01", end_date="2025-12-31", location_id="LOC-SANTIAGO-01")
        
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
            location_id: Specific location ID to filter by warehouse/bodega (optional)
        
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
        
        # NEW: Support for filtering by location_id
        if location_id:
            conditions.append(f"t.location_id = ${param_counter}")
            params.append(location_id)
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
                SUM(t.unit_cost * t.quantity) as total_cost,
                SUM(t.net_amount - (t.unit_cost * t.quantity)) as total_profit,
                CASE 
                    WHEN SUM(t.unit_cost * t.quantity) > 0 
                    THEN ((SUM(t.net_amount - (t.unit_cost * t.quantity)) / SUM(t.unit_cost * t.quantity)) * 100)
                    ELSE 0
                END as profit_margin_pct
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
                    "total_profit": float(totals['total_profit']) if totals['total_profit'] is not None else 0.0,
                    "profit_margin_pct": float(totals['profit_margin_pct']) if totals['profit_margin_pct'] is not None else 0.0,
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
        
        ⚠️ PRESENTATION REQUIREMENT: When using this tool, you MUST show ALL months individually in your response.
        DO NOT just summarize. Present EACH MONTH ON A SEPARATE LINE using bullet points or line breaks:
        
        - Enero 2025: $X,XXX,XXX.XX
        - Febrero 2025: $X,XXX,XXX.XX
        - Marzo 2025: $X,XXX,XXX.XX
        - Abril 2025: $X,XXX,XXX.XX
        (continue for EVERY month in the data, each on its own line)
        
        Then show the grand total at the end.
        
        NEVER present months in a single line without breaks. Always use line breaks or bullet points.
        
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


def create_sales_by_client_tool(queries_executed: List[Dict]):
    """Tool to get sales grouped by client"""
    
    @tool
    async def get_sales_by_client(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        client_group: Optional[str] = None,
        product_id: Optional[str] = None,
        top_n: Optional[int] = None
    ) -> str:
        """
        Get sales GROUPED BY CLIENT - shows top clients by sales amount (NO LIMIT by default).
        
        ⚠️ By default, returns top 10 clients. Use top_n to get more or fewer.
        
        ⚠️ CRITICAL: You MUST respond in the SAME LANGUAGE as the user's question.
        - If user asks in Spanish → respond in Spanish
        - If user asks in English → respond in English
        
        **USE THIS TOOL WHEN:**
        - "Clientes con mayor venta" (clients with highest sales)
        - "Top clientes por ventas" (top clients by sales)
        - "Quiénes son los clientes que más compran?" (who are the clients that buy most)
        - "Mejores clientes del mes" (best clients of the month)
        - "Dame los 5 clientes con más ventas" (give me 5 clients with most sales)
        - "¿Cuáles clientes compraron más en octubre?" (which clients bought most in October)
        - "Ranking de clientes por venta" (ranking of clients by sales)
        - "Top 25 clientes que más compran producto X" (top 25 clients buying product X) → use product_id
        - "¿Cuál es el supermercado que más vende?" (which supermarket sells most) - supermercado = cliente
        - "Supermercados con mayores ventas" (supermarkets with highest sales) - supermercado = cliente
        - "Top supermercados" (top supermarkets) - supermercado = cliente
        
        **DO NOT USE for:**
        - Product breakdown → use get_sales_by_product
        - Month by month breakdown → use get_sales_by_month
        - Total of a period → use get_sales_summary
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        
        **CRITICAL WORKFLOW FOR PRODUCTS:**
        1. If user mentions a product name:
           → FIRST call search_products(query="product name") to get the product_id
           → THEN use the product_id in this tool
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-01-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-01-31")
            client_group: EXACT client group name from search_client_groups (optional)
            product_id: Specific product ID to filter - shows clients buying this product (optional)
            top_n: Number of top clients to return (default 10)
        
        Returns:
            JSON with list of clients and their sales metrics, ordered by sales amount
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
        
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        if product_id:
            conditions.append(f"t.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        # Join with clients table
        client_join = "JOIN clients c ON t.client_id = c.client_id"
        
        # Default top_n to 10 if not specified
        if top_n is None:
            top_n = 10
        
        # Apply LIMIT
        limit_clause = f"LIMIT {top_n}"
        
        # Query to get sales grouped by client
        sql = f"""
            SELECT 
                c.client_name,
                c.client_group,
                c.city,
                SUM(t.quantity) as total_quantity,
                SUM(t.gross_amount) as total_gross,
                SUM(t.net_amount) as total_net,
                SUM(t.discount_amount) as total_discounts,
                SUM(t.unit_cost * t.quantity) as total_cost,
                SUM(t.net_amount - (t.unit_cost * t.quantity)) as total_profit,
                CASE 
                    WHEN SUM(t.unit_cost * t.quantity) > 0 
                    THEN ((SUM(t.net_amount - (t.unit_cost * t.quantity)) / SUM(t.unit_cost * t.quantity)) * 100)
                    ELSE 0
                END as profit_margin_pct,
                COUNT(*) as transaction_count,
                COUNT(DISTINCT t.product_id) as product_count
            FROM transactions t
            {client_join}
            {where_clause}
            GROUP BY c.client_name, c.client_group, c.city
            ORDER BY total_net DESC
            {limit_clause}
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
                    return json.dumps({"error": "No se encontraron ventas de clientes para el período especificado", "clients": []})
                
                # Build structured JSON response
                clients_data = []
                grand_total_net = 0.0
                grand_total_quantity = 0.0
                grand_total_profit = 0.0
                
                for row in rows:
                    total_net = float(row['total_net']) if row['total_net'] is not None else 0.0
                    total_quantity = float(row['total_quantity']) if row['total_quantity'] is not None else 0.0
                    total_profit = float(row['total_profit']) if row['total_profit'] is not None else 0.0
                    
                    grand_total_net += total_net
                    grand_total_quantity += total_quantity
                    grand_total_profit += total_profit
                    
                    clients_data.append({
                        "client_name": row['client_name'],
                        "client_group": row['client_group'] if row['client_group'] else 'N/A',
                        "city": row['city'] if row['city'] else 'N/A',
                        "total_quantity": total_quantity,
                        "total_net": total_net,
                        "total_gross": float(row['total_gross']) if row['total_gross'] is not None else 0.0,
                        "total_discounts": float(row['total_discounts']) if row['total_discounts'] is not None else 0.0,
                        "total_cost": float(row['total_cost']) if row['total_cost'] is not None else 0.0,
                        "total_profit": total_profit,
                        "profit_margin_pct": float(row['profit_margin_pct']) if row['profit_margin_pct'] is not None else 0.0,
                        "transaction_count": int(row['transaction_count']) if row['transaction_count'] is not None else 0,
                        "product_count": int(row['product_count']) if row['product_count'] is not None else 0
                    })
                
                result = {
                    "clients": clients_data,
                    "summary": {
                        "total_clients": len(clients_data),
                        "grand_total_net": grand_total_net,
                        "grand_total_quantity": grand_total_quantity,
                        "grand_total_profit": grand_total_profit
                    }
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_by_client


def create_sales_by_product_tool(queries_executed: List[Dict]):
    """Tool to get sales grouped by product"""
    
    @tool
    async def get_sales_by_product(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        client_group: Optional[str] = None,
        location_id: Optional[str] = None,
        outsourced_only: Optional[bool] = None,
        group_by: Optional[str] = "product",
        top_n: Optional[int] = None
    ) -> str:
        """
        Get sales GROUPED BY PRODUCT/CATEGORY - shows ALL products sold and their totals (NO LIMIT by default).
        
        ⚠️ By default, returns ALL products (no limit). Use top_n only if you want to limit results.
        
        ⚠️ CRITICAL: You MUST respond in the SAME LANGUAGE as the user's question.
        - If user asks in Spanish → respond in Spanish
        - If user asks in English → respond in English
        
        **USE THIS TOOL WHEN:**
        - "Ventas por producto" (sales by product - MULTIPLE products)
        - "Qué productos se vendieron en enero?" (which products were sold - LIST of products)
        - "Ventas sumarizadas por producto" (sales summarized by product - ALL products)
        - "Cuáles fueron los productos más vendidos?" (which were the top selling products - RANKING)
        - "Dame el desglose de ventas por producto" (give me breakdown by product - ALL products)
        - "Productos vendidos en el mes de X" (products sold in month X - LIST)
        - "Todos los productos vendidos" (all products sold - LIST)
        - "Ventas de maquilas" (sales of outsourced products) → use outsourced_only=True
        - "Ventas por categoría" (sales by category) → use group_by="category"
        - "Ventas en bodega X" (sales at warehouse X) → use location_id
        
        **DO NOT USE for:**
        - "¿Cuánto vendimos de X?" → use get_sales_summary instead (wants ONE total for ONE product)
        - "Total de ventas de enero a octubre" → use get_sales_summary instead (wants ONE grand total)
        - "Ventas de UN producto específico" → use get_sales_summary with product_id (wants ONE result)
        - Month by month breakdown → use get_sales_by_month
        - "Ventas en dólares y cantidades de [producto]" → use get_sales_summary with product_id
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-01-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-01-31")
            client_group: EXACT client group name from search_client_groups (optional)
            location_id: Filter sales from specific warehouse/location (optional)
            outsourced_only: If True, only show outsourced/maquila products (optional)
            group_by: Group results by "product" (default), "category", or "subcategory"
            top_n: OPTIONAL - Number of top products to return. If not specified, returns ALL products.
        
        Returns:
            JSON with list of ALL products (or top N if specified) and their sales metrics including profitability
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
        
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        if location_id:
            conditions.append(f"b.location_id = ${param_counter}")
            params.append(location_id)
            param_counter += 1
        
        if outsourced_only is not None:
            conditions.append(f"p.outsourced = {outsourced_only}")
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        # Join with clients table if filtering by client_group
        client_join = "JOIN clients c ON t.client_id = c.client_id" if client_group else ""
        
        # Join with backorder for location filter if needed
        location_join = "LEFT JOIN backorder b ON t.product_id = b.product_id AND t.client_id = b.client_id" if location_id else ""
        
        # Apply LIMIT only if top_n is specified
        limit_clause = f"LIMIT {top_n}" if top_n is not None else ""
        
        # Determine GROUP BY clause based on group_by parameter
        if group_by == "category":
            group_cols = "p.category"
            select_cols = "p.category as group_name, 'category' as group_type"
        elif group_by == "subcategory":
            group_cols = "p.category, p.subcategory"
            select_cols = "p.category, p.subcategory as group_name, 'subcategory' as group_type"
        else:  # default: product
            group_cols = "p.product_name, p.brand, p.category"
            select_cols = "p.product_name, p.brand, p.category"
        
        # Query to get sales grouped by product/category
        sql = f"""
            SELECT 
                {select_cols},
                COUNT(DISTINCT t.client_id) as client_count,
                SUM(t.quantity) as total_quantity,
                SUM(t.gross_amount) as total_gross,
                SUM(t.net_amount) as total_net,
                SUM(t.discount_amount) as total_discounts,
                SUM(t.unit_cost * t.quantity) as total_cost,
                SUM(t.net_amount - (t.unit_cost * t.quantity)) as total_profit,
                CASE 
                    WHEN SUM(t.unit_cost * t.quantity) > 0 
                    THEN ((SUM(t.net_amount - (t.unit_cost * t.quantity)) / SUM(t.unit_cost * t.quantity)) * 100)
                    ELSE 0
                END as profit_margin_pct,
                COUNT(*) as transaction_count
            FROM transactions t
            JOIN products p ON t.product_id = p.product_id
            {client_join}
            {location_join}
            {where_clause}
            GROUP BY {group_cols}
            ORDER BY total_net DESC
            {limit_clause}
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
                    return json.dumps({"error": "No se encontraron ventas de productos para el período especificado", "products": []})
                
                # Build structured JSON response
                products_data = []
                grand_total_net = 0.0
                grand_total_quantity = 0.0
                grand_total_profit = 0.0
                
                for row in rows:
                    total_net = float(row['total_net']) if row['total_net'] is not None else 0.0
                    total_quantity = float(row['total_quantity']) if row['total_quantity'] is not None else 0.0
                    total_profit = float(row['total_profit']) if row['total_profit'] is not None else 0.0
                    
                    grand_total_net += total_net
                    grand_total_quantity += total_quantity
                    grand_total_profit += total_profit
                    
                    item = {
                        "total_quantity": total_quantity,
                        "total_net": total_net,
                        "total_gross": float(row['total_gross']) if row['total_gross'] is not None else 0.0,
                        "total_discounts": float(row['total_discounts']) if row['total_discounts'] is not None else 0.0,
                        "total_cost": float(row['total_cost']) if row['total_cost'] is not None else 0.0,
                        "total_profit": total_profit,
                        "profit_margin_pct": float(row['profit_margin_pct']) if row['profit_margin_pct'] is not None else 0.0,
                        "client_count": int(row['client_count']) if row['client_count'] is not None else 0,
                        "transaction_count": int(row['transaction_count']) if row['transaction_count'] is not None else 0
                    }
                    
                    # Add grouping-specific fields
                    if group_by == "category":
                        item["category"] = row['group_name']
                        item["group_type"] = "category"
                    elif group_by == "subcategory":
                        item["category"] = row['category']
                        item["subcategory"] = row['group_name']
                        item["group_type"] = "subcategory"
                    else:
                        item["product_name"] = row['product_name']
                        item["brand"] = row['brand']
                        item["category"] = row['category']
                    
                    products_data.append(item)
                
                result = {
                    "products": products_data,
                    "summary": {
                        "total_products": len(products_data),
                        "grand_total_net": grand_total_net,
                        "grand_total_quantity": grand_total_quantity,
                        "grand_total_profit": grand_total_profit,
                        "group_by": group_by
                    }
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_by_product


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
        client_group: Optional[str] = None,
        group_by: Optional[str] = None
    ) -> str:
        """
        Get TOTAL AGGREGATED budget metrics (SUM of all budgets, no limits).
        
        **USE THIS TOOL WHEN:**
        - User asks "¿Cuánto es el presupuesto?" (wants total budget)
        - "Presupuesto total de septiembre" (wants budget aggregate)
        - "Dame el presupuesto del grupo X" (wants budget by ONE specific group)
        - "Presupuesto de junio 2025" (wants budget sum)
        - "Presupuesto POR grupo" (wants budget breakdown by ALL groups)
        - "Presupuesto POR cliente" (wants budget breakdown by clients)
        
        **DO NOT USE for:**
        - "Lista de presupuestos" → use query_budgets instead
        - "Budget vs ventas" → use get_budget_performance instead
        
        **CRITICAL WORKFLOW FOR CLIENT GROUPS:**
        1. If user mentions a group name (e.g., "Xtra", "Super"):
           → FIRST call search_client_groups(query="Xtra") to get the EXACT group name
           → THEN use the exact name returned in client_group parameter
        
        **IMPORTANT:**
        - Use `customer_id` for a SPECIFIC CLIENT (e.g., customer_id='C12345')
        - Use `client_group` ONLY with the EXACT group name from search_client_groups (filters to one group)
        - Use `group_by="group"` when user asks "presupuesto POR grupo" (shows ALL groups)
        - Use `group_by="client"` when user asks "presupuesto POR cliente" (shows top clients)
        - Budget dates are stored as first day of month (e.g., '2025-09-01' for September)
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-09-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-09-30")
            customer_id: Specific customer ID to filter (optional)
            client_group: EXACT client group name from search_client_groups (optional)
            group_by: Aggregation level - "group" for by client_group, "client" for by client, None for total only
        
        Returns:
            JSON with total budget, record count, and breakdown by group or client if requested
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
            conditions.append(f"b.client_id = ${param_counter}")
            params.append(customer_id)
            param_counter += 1
        
        # NEW: Support for filtering by client_group
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # Join with clients table if filtering by client_group or grouping by group
        needs_client_join = client_group or group_by == "group"
        client_join = "LEFT JOIN clients c ON b.client_id = c.client_id" if needs_client_join else ""
        
        # Get totals - Updated to use new budgets schema with client_name and client_code
        sql_totals = f"""
            SELECT 
                COUNT(*) as record_count,
                SUM(b.budget) as total_budget,
                COUNT(DISTINCT b.client_id) as customer_count,
                MIN(b.date) as earliest_date,
                MAX(b.date) as latest_date
            FROM budgets b
            {client_join}
            {where_clause}
        """
        
        # Build breakdown query based on group_by parameter
        if group_by == "group":
            # Aggregate by client_group
            sql_breakdown = f"""
                SELECT 
                    c.client_group,
                    SUM(b.budget) as total_budget,
                    COUNT(DISTINCT b.client_id) as client_count,
                    COUNT(*) as months_count
                FROM budgets b
                LEFT JOIN clients c ON b.client_id = c.client_id
                {where_clause}
                GROUP BY c.client_group
                ORDER BY total_budget DESC
            """
        elif group_by == "client":
            # Top clients (existing behavior)
            sql_breakdown = f"""
                SELECT 
                    b.client_name,
                    c.client_group,
                    SUM(b.budget) as total_budget,
                    COUNT(*) as months_count
                FROM budgets b
                LEFT JOIN clients c ON b.client_id = c.client_id
                {where_clause}
                GROUP BY b.client_name, c.client_group
                ORDER BY total_budget DESC
                LIMIT 50
            """
        else:
            # Default: top 10 customers
            sql_breakdown = f"""
                SELECT 
                    b.client_name,
                    c.client_group,
                    SUM(b.budget) as total_budget,
                    COUNT(*) as months_count
                FROM budgets b
                LEFT JOIN clients c ON b.client_id = c.client_id
                {where_clause}
                GROUP BY b.client_name, c.client_group
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
                
                # Get breakdown (by group or by client)
                breakdown_rows = await conn.fetch(sql_breakdown, *params)
                
                # Build structured JSON response so the agent can format it in the user's language
                record_count = int(totals['record_count']) if totals['record_count'] is not None else 0
                total_budget = float(totals['total_budget']) if totals['total_budget'] is not None else 0.0
                customer_count = int(totals['customer_count']) if totals['customer_count'] is not None else 0
                
                result = {
                    "record_count": record_count,
                    "total_budget": total_budget,
                    "customer_count": customer_count,
                    "group_by": group_by
                }
                
                if totals['earliest_date'] and totals['latest_date']:
                    result["earliest_date"] = totals['earliest_date'].strftime('%Y-%m-%d')
                    result["latest_date"] = totals['latest_date'].strftime('%Y-%m-%d')
                
                # Build breakdown list based on group_by
                breakdown_list = []
                if breakdown_rows:
                    if group_by == "group":
                        # Group breakdown
                        for row in breakdown_rows:
                            budget = float(row['total_budget']) if row['total_budget'] is not None else 0.0
                            client_count = int(row['client_count']) if row['client_count'] is not None else 0
                            months = int(row['months_count']) if row['months_count'] is not None else 0
                            breakdown_list.append({
                                "client_group": row['client_group'] or 'Sin Grupo',
                                "total_budget": budget,
                                "client_count": client_count,
                                "months_count": months
                            })
                        result["groups"] = breakdown_list
                    else:
                        # Client breakdown
                        for row in breakdown_rows:
                            budget = float(row['total_budget']) if row['total_budget'] is not None else 0.0
                            months = int(row['months_count']) if row['months_count'] is not None else 0
                            group = row['client_group'] or 'Sin Grupo'
                            breakdown_list.append({
                                "client_name": row['client_name'],
                                "client_group": group,
                                "total_budget": budget,
                                "months_count": months
                            })
                        result["top_customers"] = breakdown_list
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_budgets_summary


# ============================================================================
# NEW ANALYTICAL TOOLS - Growth, Inactive Clients, Product Launch
# ============================================================================

def create_product_first_sale_tool(queries_executed: List[Dict]):
    """Tool to find when a product was first sold"""
    
    @tool
    async def get_product_first_sale(
        product_id: str
    ) -> str:
        """
        Find when a product was first sold (launch date).
        
        **USE THIS TOOL WHEN:**
        - "¿Cuándo arrancó la venta de producto X?" (when did product X start selling)
        - "Primera venta de producto" (first sale of product)
        - "Fecha de lanzamiento de producto" (product launch date)
        
        **WORKFLOW:**
        1. If user mentions product name: search_products(query="name") first to get product_id
        2. Then call this tool with the product_id
        
        Args:
            product_id: Product ID (required) - get from search_products first
        
        Returns:
            JSON with first sale information including date, client, seller, and days since launch
        """
        sql = """
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                p.category,
                t.date as first_sale_date,
                t.client_id,
                c.client_name as first_client_name,
                c.client_group as first_client_group,
                t.seller_name as first_seller_name,
                t.quantity as first_sale_quantity,
                t.net_amount as first_sale_amount,
                EXTRACT(DAY FROM (CURRENT_DATE - t.date)) as days_since_launch
            FROM products p
            JOIN transactions t ON p.product_id = t.product_id
            JOIN clients c ON t.client_id = c.client_id
            WHERE p.product_id = $1
                AND t.transaction_type = 'SALE'
            ORDER BY t.date ASC
            LIMIT 1
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [product_id],
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(sql, product_id)
                
                if not row:
                    return json.dumps({
                        "found": False,
                        "error": f"No se encontraron ventas para el producto {product_id}",
                        "product_id": product_id
                    })
                
                result = {
                    "found": True,
                    "product_id": row['product_id'],
                    "product_name": row['product_name'],
                    "brand": row['brand'],
                    "category": row['category'],
                    "first_sale_date": row['first_sale_date'].strftime('%Y-%m-%d'),
                    "first_client_id": row['client_id'],
                    "first_client_name": row['first_client_name'],
                    "first_client_group": row['first_client_group'],
                    "first_seller_name": row['first_seller_name'],
                    "first_sale_quantity": float(row['first_sale_quantity']),
                    "first_sale_amount": float(row['first_sale_amount']),
                    "days_since_launch": int(row['days_since_launch']) if row['days_since_launch'] else 0
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_product_first_sale


def create_inactive_clients_tool(queries_executed: List[Dict]):
    """Tool to identify clients with no recent sales"""
    
    @tool
    async def get_inactive_clients(
        days_threshold: int = 90,
        top_n: int = 50
    ) -> str:
        """
        Identify clients with no sales in the last N days.
        
        **USE THIS TOOL WHEN:**
        - "Clientes con más de X meses sin venta" (clients with +X months without sales)
        - "Clientes inactivos" (inactive clients)
        - "Clientes que dejaron de comprar" (clients that stopped buying)
        - "Detalle los clientes con más de 3 meses sin venta y quién es su vendedor"
        
        Args:
            days_threshold: Days without sales to consider inactive (default 90 days)
            top_n: Number of results to return (default 50)
        
        Returns:
            JSON with list of inactive clients including last sale date, seller, and historical sales
        """
        from datetime import datetime, timedelta
        
        # Calculate threshold date
        threshold_date = datetime.now().date() - timedelta(days=days_threshold)
        
        sql = """
            WITH last_sale AS (
                SELECT
                    client_id,
                    MAX(date) AS last_sale_date
                FROM transactions
                WHERE transaction_type = 'SALE'
                GROUP BY client_id
            ),
            sales_agg AS (
                SELECT
                    client_id,
                    SUM(net_amount) AS total_historical_sales,
                    COUNT(*) AS total_transactions
                FROM transactions
                WHERE transaction_type = 'SALE'
                GROUP BY client_id
            )
            SELECT
                c.client_id,
                c.client_name,
                c.client_group,
                c.city,
                ls.last_sale_date,
                COALESCE(sa.total_historical_sales, 0) AS total_historical_sales,
                COALESCE(sa.total_transactions, 0) AS total_transactions
            FROM clients c
            LEFT JOIN last_sale ls ON ls.client_id = c.client_id
            LEFT JOIN sales_agg sa ON sa.client_id = c.client_id
            WHERE ls.last_sale_date < $1
               OR ls.last_sale_date IS NULL
            ORDER BY ls.last_sale_date ASC NULLS FIRST,
                     total_historical_sales DESC
            LIMIT $2
        """
        
        params = [threshold_date, top_n]
        
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
                    return json.dumps({
                        "found": False,
                        "message": f"No se encontraron clientes inactivos con más de {days_threshold} días sin ventas",
                        "clients": []
                    })
                
                clients = []
                current_date = datetime.now().date()
                
                for row in rows:
                    # Calculate days_since_last_sale
                    if row['last_sale_date']:
                        days_diff = (current_date - row['last_sale_date']).days
                    else:
                        days_diff = None
                    
                    clients.append({
                        "client_id": row['client_id'],
                        "client_name": row['client_name'],
                        "client_group": row['client_group'] if row['client_group'] else 'N/A',
                        "city": row['city'] if row['city'] else 'N/A',
                        "last_sale_date": row['last_sale_date'].strftime('%Y-%m-%d') if row['last_sale_date'] else 'Never',
                        "days_since_last_sale": days_diff if days_diff is not None else 'Never sold',
                        "total_historical_sales": float(row['total_historical_sales']),
                        "total_transactions": int(row['total_transactions'])
                    })
                
                result = {
                    "found": True,
                    "threshold_days": days_threshold,
                    "total_inactive_clients": len(clients),
                    "clients": clients
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_inactive_clients


def create_product_growth_analysis_tool(queries_executed: List[Dict]):
    """Tool to analyze product sales growth/decline trends"""
    
    @tool
    async def get_product_growth_analysis(
        product_id: Optional[str] = None,
        category: Optional[str] = None,
        periods_back: int = 12,
        top_n: int = 20
    ) -> str:
        """
        Analyze sales growth/decline trends for products over time.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué productos están creciendo/decreciendo?" (which products are growing/declining)
        - "Productos con crecimiento vs mes/año pasado" (products with growth vs last month/year)
        - "¿Cuáles son los productos que vienen decreciendo en los últimos 2 años?"
        - "Dame la venta x Clases e indícame cuáles vienen decreciendo"
        
        **WORKFLOW:**
        1. If user mentions product name: search_products first
        2. If user mentions category: use category parameter
        
        Args:
            product_id: Specific product ID to analyze (optional)
            category: Product category to analyze (optional)
            periods_back: Number of months to analyze (default 12)
            top_n: Number of products to return if no product_id specified (default 20)
        
        Returns:
            JSON with products, their trend (growing/declining/stable), and growth rate
        """
        conditions = ["t.transaction_type = 'SALE'"]
        params = []
        param_counter = 1
        
        if product_id:
            conditions.append(f"p.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if category:
            conditions.append(f"p.category = ${param_counter}")
            params.append(category)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        # Calculate growth by comparing recent period vs previous period
        sql = f"""
            WITH monthly_sales AS (
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.brand,
                    p.category,
                    DATE_TRUNC('month', t.date) as month,
                    SUM(t.net_amount) as monthly_sales
                FROM transactions t
                JOIN products p ON t.product_id = p.product_id
                {where_clause}
                    AND t.date >= CURRENT_DATE - INTERVAL '{periods_back} months'
                GROUP BY p.product_id, p.product_name, p.brand, p.category, DATE_TRUNC('month', t.date)
            ),
            recent_sales AS (
                SELECT 
                    product_id,
                    product_name,
                    brand,
                    category,
                    AVG(monthly_sales) as avg_recent_sales
                FROM monthly_sales
                WHERE month >= CURRENT_DATE - INTERVAL '3 months'
                GROUP BY product_id, product_name, brand, category
            ),
            previous_sales AS (
                SELECT 
                    product_id,
                    AVG(monthly_sales) as avg_previous_sales
                FROM monthly_sales
                WHERE month < CURRENT_DATE - INTERVAL '3 months'
                    AND month >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY product_id
            )
            SELECT 
                r.product_id,
                r.product_name,
                r.brand,
                r.category,
                r.avg_recent_sales,
                COALESCE(p.avg_previous_sales, 0) as avg_previous_sales,
                CASE 
                    WHEN COALESCE(p.avg_previous_sales, 0) > 0 
                    THEN ((r.avg_recent_sales - p.avg_previous_sales) / p.avg_previous_sales * 100)
                    ELSE 0
                END as growth_rate_pct,
                CASE 
                    WHEN COALESCE(p.avg_previous_sales, 0) = 0 THEN 'new'
                    WHEN ((r.avg_recent_sales - p.avg_previous_sales) / p.avg_previous_sales * 100) > 10 THEN 'growing'
                    WHEN ((r.avg_recent_sales - p.avg_previous_sales) / p.avg_previous_sales * 100) < -10 THEN 'declining'
                    ELSE 'stable'
                END as trend
            FROM recent_sales r
            LEFT JOIN previous_sales p ON r.product_id = p.product_id
            ORDER BY growth_rate_pct DESC
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
                    return json.dumps({
                        "found": False,
                        "message": "No se encontraron datos de crecimiento para los productos especificados",
                        "products": []
                    })
                
                products = []
                for row in rows:
                    products.append({
                        "product_id": row['product_id'],
                        "product_name": row['product_name'],
                        "brand": row['brand'],
                        "category": row['category'],
                        "avg_recent_sales": float(row['avg_recent_sales']),
                        "avg_previous_sales": float(row['avg_previous_sales']),
                        "growth_rate_pct": float(row['growth_rate_pct']),
                        "trend": row['trend'],
                        "recommendation": "keep" if row['trend'] in ['growing', 'stable'] else "watch" if row['growth_rate_pct'] > -30 else "consider_discontinue"
                    })
                
                result = {
                    "found": True,
                    "periods_analyzed": periods_back,
                    "total_products": len(products),
                    "products": products
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_product_growth_analysis


def create_sales_comparison_tool(queries_executed: List[Dict]):
    """Tool to compare sales with previous year"""
    
    @tool
    async def get_sales_comparison(
        start_date: str,
        end_date: str,
        client_group: Optional[str] = None,
        product_id: Optional[str] = None
    ) -> str:
        """
        Compare sales with the same period in the previous year.
        
        **USE THIS TOOL WHEN:**
        - "Crecimiento en ventas vs el año pasado" (growth vs last year)
        - "Comparar ventas con el año anterior" (compare sales with previous year)
        - "¿Cómo va el crecimiento vs el año pasado por cadena?"
        - "Crecimiento productos maquilas vs año pasado"
        
        **WORKFLOW:**
        If user mentions client group: search_client_groups first to get exact name
        
        Args:
            start_date: Start date for current period (YYYY-MM-DD)
            end_date: End date for current period (YYYY-MM-DD)
            client_group: EXACT client group name from search_client_groups (optional)
            product_id: Specific product to compare (optional)
        
        Returns:
            JSON with current period sales, previous year sales, and growth percentage
        """
        conditions_current = ["t.transaction_type = 'SALE'"]
        conditions_previous = ["t.transaction_type = 'SALE'"]
        params_current = []
        params_previous = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if not start_date_obj or not end_date_obj:
            return json.dumps({"error": "Invalid date format. Use YYYY-MM-DD"})
        
        # Calculate previous year dates
        from datetime import timedelta
        previous_start = start_date_obj.replace(year=start_date_obj.year - 1)
        previous_end = end_date_obj.replace(year=end_date_obj.year - 1)
        
        # Current period
        conditions_current.append(f"t.date >= ${param_counter}")
        params_current.append(start_date_obj)
        param_counter += 1
        conditions_current.append(f"t.date <= ${param_counter}")
        params_current.append(end_date_obj)
        param_counter += 1
        
        # Previous period
        param_counter_prev = 1
        conditions_previous.append(f"t.date >= ${param_counter_prev}")
        params_previous.append(previous_start)
        param_counter_prev += 1
        conditions_previous.append(f"t.date <= ${param_counter_prev}")
        params_previous.append(previous_end)
        param_counter_prev += 1
        
        # Apply filters
        if client_group:
            conditions_current.append(f"c.client_group = ${param_counter}")
            params_current.append(client_group)
            conditions_previous.append(f"c.client_group = ${param_counter_prev}")
            params_previous.append(client_group)
            param_counter += 1
            param_counter_prev += 1
        
        if product_id:
            conditions_current.append(f"t.product_id = ${param_counter}")
            params_current.append(product_id)
            conditions_previous.append(f"t.product_id = ${param_counter_prev}")
            params_previous.append(product_id)
        
        client_join = "JOIN clients c ON t.client_id = c.client_id" if client_group else ""
        
        where_current = f"WHERE {' AND '.join(conditions_current)}"
        where_previous = f"WHERE {' AND '.join(conditions_previous)}"
        
        # Query for current period
        sql_current = f"""
            SELECT 
                SUM(t.net_amount) as total_sales,
                SUM(t.quantity) as total_quantity,
                COUNT(*) as transaction_count
            FROM transactions t
            {client_join}
            {where_current}
        """
        
        # Query for previous period
        sql_previous = f"""
            SELECT 
                SUM(t.net_amount) as total_sales,
                SUM(t.quantity) as total_quantity,
                COUNT(*) as transaction_count
            FROM transactions t
            {client_join}
            {where_previous}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": f"CURRENT: {sql_current} | PREVIOUS: {sql_previous}",
            "params": params_current + params_previous,
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                current = await conn.fetchrow(sql_current, *params_current)
                previous = await conn.fetchrow(sql_previous, *params_previous)
                
                current_sales = float(current['total_sales']) if current['total_sales'] else 0.0
                previous_sales = float(previous['total_sales']) if previous['total_sales'] else 0.0
                
                growth_pct = 0.0
                if previous_sales > 0:
                    growth_pct = ((current_sales - previous_sales) / previous_sales) * 100
                
                result = {
                    "current_period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "total_sales": current_sales,
                        "total_quantity": float(current['total_quantity']) if current['total_quantity'] else 0.0,
                        "transaction_count": int(current['transaction_count']) if current['transaction_count'] else 0
                    },
                    "previous_year": {
                        "start_date": previous_start.strftime('%Y-%m-%d'),
                        "end_date": previous_end.strftime('%Y-%m-%d'),
                        "total_sales": previous_sales,
                        "total_quantity": float(previous['total_quantity']) if previous['total_quantity'] else 0.0,
                        "transaction_count": int(previous['transaction_count']) if previous['transaction_count'] else 0
                    },
                    "comparison": {
                        "sales_difference": current_sales - previous_sales,
                        "growth_rate_pct": growth_pct,
                        "trend": "growing" if growth_pct > 0 else "declining" if growth_pct < 0 else "stable"
                    }
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_comparison


def create_budget_performance_tool(queries_executed: List[Dict]):
    """Tool to analyze budget vs actual sales performance by client or client group"""
    
    @tool
    async def get_budget_performance(
        year: int,
        month: int,
        group_by: str = "client",
        filter_status: Optional[str] = None,
        client_group: Optional[str] = None,
        top_n: int = 50
    ) -> str:
        """
        Analyze budget vs actual sales performance for a specific month.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué clientes están por debajo del presupuesto?" (which clients are below budget)
        - "¿Qué cadenas están por debajo del presupuesto?" (which chains are below budget)
        - "Clientes que cumplen/no cumplen presupuesto" (clients meeting/not meeting budget)
        - "Dame los clientes por encima del presupuesto" (clients above budget)
        
        **CRITICAL WORKFLOW:**
        1. If user asks about "este mes" (this month) → use current year and month
        2. If user mentions client group name → search_client_groups first
        
        Args:
            year: Year to analyze (e.g., 2025)
            month: Month to analyze (1-12)
            group_by: Group results by "client" (individual clients) or "group" (client groups)
            filter_status: Filter results - "below_budget", "above_budget", or None for all
            client_group: EXACT client group name to filter (optional)
            top_n: Number of results to return (default 50)
        
        Returns:
            JSON with clients/groups, their budget, actual sales, variance, and achievement %
        """
        params = []
        param_counter = 1
        
        # Calculate date range
        # First day of the month
        date_start = f"DATE '{year}-{month:02d}-01'"
        # First day of next month
        if month == 12:
            date_end = f"DATE '{year + 1}-01-01'"
        else:
            date_end = f"DATE '{year}-{month + 1:02d}-01'"
        
        # Optional client group filter for the final SELECT
        group_filter = ""
        if client_group:
            group_filter = f"WHERE c.client_group = ${param_counter}"
            params.append(client_group)
            param_counter += 1
        
        # Determine grouping and output columns
        if group_by == "group":
            # For client_group aggregation - Using budgets table with client_name directly
            sql = f"""
                WITH budgets_by_group AS (
                    SELECT
                        c.client_group,
                        SUM(b.budget) AS budget
                    FROM budgets b
                    LEFT JOIN clients c ON c.client_id = b.client_id
                    WHERE b.date >= {date_start}
                      AND b.date < {date_end}
                    GROUP BY c.client_group
                ),
                sales_by_group AS (
                    SELECT
                        c.client_group,
                        SUM(t.net_amount) AS sales
                    FROM transactions t
                    JOIN clients c ON c.client_id = t.client_id
                    WHERE t.date >= {date_start}
                      AND t.date < {date_end}
                    GROUP BY c.client_group
                )
                SELECT
                    COALESCE(b.client_group, s.client_group) as name,
                    COALESCE(b.budget, 0) as budget,
                    COALESCE(s.sales, 0) as actual_sales,
                    COALESCE(b.budget, 0) - COALESCE(s.sales, 0) as variance,
                    CASE 
                        WHEN COALESCE(b.budget, 0) > 0 
                        THEN (COALESCE(s.sales, 0) / COALESCE(b.budget, 0) * 100)
                        ELSE 0
                    END as achievement_pct,
                    CASE 
                        WHEN COALESCE(b.budget, 0) > COALESCE(s.sales, 0) THEN 'below_budget'
                        WHEN COALESCE(b.budget, 0) < COALESCE(s.sales, 0) THEN 'above_budget'
                        ELSE 'on_budget'
                    END as status
                FROM budgets_by_group b
                FULL OUTER JOIN sales_by_group s ON s.client_group = b.client_group
                {group_filter}
                {"WHERE COALESCE(b.budget, 0) > COALESCE(s.sales, 0)" if filter_status == "below_budget" else ""}
                {"WHERE COALESCE(b.budget, 0) <= COALESCE(s.sales, 0)" if filter_status == "above_budget" else ""}
                ORDER BY variance DESC
                LIMIT {top_n}
            """
        else:  # client
            # Using budgets.client_name directly instead of joining
            sql = f"""
                WITH budgets_by_name AS (
                    SELECT
                        b.client_name,
                        SUM(b.budget) AS budget
                    FROM budgets b
                    WHERE b.date >= {date_start}
                      AND b.date < {date_end}
                    GROUP BY b.client_name
                ),
                sales_by_name AS (
                    SELECT
                        c.client_name,
                        SUM(t.net_amount) AS sales
                    FROM transactions t
                    JOIN clients c ON c.client_id = t.client_id
                    WHERE t.date >= {date_start}
                      AND t.date < {date_end}
                    GROUP BY c.client_name
                )
                SELECT
                    COALESCE(b.client_name, s.client_name) AS name,
                    COALESCE(b.budget, 0) AS budget,
                    COALESCE(s.sales, 0) AS actual_sales,
                    COALESCE(b.budget, 0) - COALESCE(s.sales, 0) AS variance,
                    CASE 
                        WHEN COALESCE(b.budget, 0) > 0 
                        THEN (COALESCE(s.sales, 0) / COALESCE(b.budget, 0) * 100)
                        ELSE 0
                    END as achievement_pct,
                    CASE 
                        WHEN COALESCE(b.budget, 0) > COALESCE(s.sales, 0) THEN 'below_budget'
                        WHEN COALESCE(b.budget, 0) < COALESCE(s.sales, 0) THEN 'above_budget'
                        ELSE 'on_budget'
                    END as status
                FROM budgets_by_name b
                FULL OUTER JOIN sales_by_name s ON s.client_name = b.client_name
                {group_filter}
                {"WHERE COALESCE(b.budget, 0) > COALESCE(s.sales, 0)" if filter_status == "below_budget" else ""}
                {"WHERE COALESCE(b.budget, 0) <= COALESCE(s.sales, 0)" if filter_status == "above_budget" else ""}
                ORDER BY variance DESC
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
                    return json.dumps({
                        "found": False,
                        "message": f"No se encontraron datos de presupuesto para {year}-{month:02d}",
                        "results": []
                    })
                
                results = []
                for row in rows:
                    item = {
                        "budget": float(row['budget']),
                        "actual_sales": float(row['actual_sales']),
                        "variance": float(row['variance']),
                        "achievement_pct": float(row['achievement_pct']),
                        "status": row['status']
                    }
                    
                    if group_by == "group":
                        item["client_group"] = row['name']
                    else:
                        item["client_name"] = row['name']
                    
                    results.append(item)
                
                result = {
                    "found": True,
                    "period": f"{year}-{month:02d}",
                    "group_by": group_by,
                    "filter_status": filter_status or "all",
                    "total_results": len(results),
                    "results": results
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_budget_performance


def create_discontinuation_candidates_tool(queries_executed: List[Dict]):
    """Tool to identify products that could be discontinued"""
    
    @tool
    async def get_discontinuation_candidates(
        sales_threshold: float = 1000.0,
        months_lookback: int = 6,
        top_n: int = 50
    ) -> str:
        """
        Identify products with low sales that could be discontinued.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué productos sugieres descatalogar por poca venta?"
        - "Productos con baja venta para descatalogar"
        - "Productos candidatos a descontinuar"
        - "Dime los productos que llevan 3 o más meses sin venta"
        
        Logic:
        - Low average monthly sales (below threshold)
        - Analyzed over last N months
        - Considers inventory levels and backorders
        
        Args:
            sales_threshold: Minimum avg monthly sales to keep product (default $1000)
            months_lookback: Number of months to analyze (default 6)
            top_n: Number of candidates to return (default 50)
        
        Returns:
            JSON with list of products recommended for discontinuation with scores
        """
        sql = f"""
            WITH product_sales AS (
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.brand,
                    p.category,
                    p.subcategory,
                    COUNT(DISTINCT DATE_TRUNC('month', t.date)) as months_with_sales,
                    SUM(t.net_amount) as total_sales,
                    SUM(t.net_amount) / NULLIF(COUNT(DISTINCT DATE_TRUNC('month', t.date)), 0) as avg_monthly_sales,
                    MAX(t.date) as last_sale_date,
                    EXTRACT(DAY FROM (CURRENT_DATE - MAX(t.date))) as days_since_last_sale
                FROM products p
                LEFT JOIN transactions t ON p.product_id = t.product_id
                    AND t.transaction_type = 'SALE'
                    AND t.date >= CURRENT_DATE - INTERVAL '{months_lookback} months'
                GROUP BY p.product_id, p.product_name, p.brand, p.category, p.subcategory
            ),
            product_inventory AS (
                SELECT 
                    product_id,
                    SUM(inventory_qty) as total_inventory
                FROM inventory
                GROUP BY product_id
            ),
            product_backorders AS (
                SELECT 
                    product_id,
                    COUNT(*) as backorder_count,
                    SUM(backorder_qty) as total_backorder_qty
                FROM backorder
                WHERE date >= CURRENT_DATE - INTERVAL '3 months'
                GROUP BY product_id
            )
            SELECT 
                ps.product_id,
                ps.product_name,
                ps.brand,
                ps.category,
                ps.subcategory,
                ps.months_with_sales,
                COALESCE(ps.total_sales, 0) as total_sales,
                COALESCE(ps.avg_monthly_sales, 0) as avg_monthly_sales,
                ps.last_sale_date,
                COALESCE(ps.days_since_last_sale, 9999) as days_since_last_sale,
                COALESCE(pi.total_inventory, 0) as current_inventory,
                COALESCE(pb.backorder_count, 0) as recent_backorders,
                CASE 
                    WHEN COALESCE(ps.avg_monthly_sales, 0) < {sales_threshold * 0.25} THEN 'high_priority'
                    WHEN COALESCE(ps.avg_monthly_sales, 0) < {sales_threshold * 0.5} THEN 'medium_priority'
                    ELSE 'low_priority'
                END as discontinuation_priority
            FROM product_sales ps
            LEFT JOIN product_inventory pi ON ps.product_id = pi.product_id
            LEFT JOIN product_backorders pb ON ps.product_id = pb.product_id
            WHERE COALESCE(ps.avg_monthly_sales, 0) < {sales_threshold}
                AND COALESCE(pb.backorder_count, 0) = 0
            ORDER BY ps.avg_monthly_sales ASC, ps.days_since_last_sale DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [],
            "source": "simple_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql)
                
                if not rows:
                    return json.dumps({
                        "found": False,
                        "message": f"No se encontraron productos con ventas menores a ${sales_threshold} mensuales",
                        "candidates": []
                    })
                
                candidates = []
                for row in rows:
                    candidates.append({
                        "product_id": row['product_id'],
                        "product_name": row['product_name'],
                        "brand": row['brand'],
                        "category": row['category'],
                        "subcategory": row['subcategory'],
                        "months_with_sales": int(row['months_with_sales']) if row['months_with_sales'] else 0,
                        "total_sales": float(row['total_sales']),
                        "avg_monthly_sales": float(row['avg_monthly_sales']),
                        "last_sale_date": row['last_sale_date'].strftime('%Y-%m-%d') if row['last_sale_date'] else 'Never',
                        "days_since_last_sale": int(row['days_since_last_sale']) if row['days_since_last_sale'] < 9999 else 'Never',
                        "current_inventory": int(row['current_inventory']),
                        "recent_backorders": int(row['recent_backorders']),
                        "discontinuation_priority": row['discontinuation_priority']
                    })
                
                result = {
                    "found": True,
                    "criteria": {
                        "sales_threshold": sales_threshold,
                        "months_analyzed": months_lookback
                    },
                    "total_candidates": len(candidates),
                    "candidates": candidates
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_discontinuation_candidates


def create_products_not_sold_tool(queries_executed: List[Dict]):
    """Tool to identify products that had ZERO sales in a specific period"""
    
    @tool
    async def get_products_not_sold(
        start_date: str,
        end_date: str,
        location_id: Optional[str] = None,
        top_n: int = 100
    ) -> str:
        """
        Identify products that had ZERO sales in a specific time period.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué productos no se vendieron en octubre?"
        - "Productos sin venta en el último trimestre"
        - "Dame productos que no se vendieron este mes"
        - "Productos con inventario pero sin ventas en [periodo]"
        - "Productos en el depósito X que no se vendieron"
        
        **IMPORTANT:** This finds products with ZERO sales. For products with LOW sales,
        use get_discontinuation_candidates instead.
        
        Args:
            start_date: Start date for period (format: YYYY-MM-DD)
            end_date: End date for period (format: YYYY-MM-DD)
            location_id: Optional - specific location/warehouse (if None, shows all locations)
            top_n: Number of results to return (default 100)
        
        Returns:
            JSON with list of products that had no sales in the period, with inventory info
        """
        params = []
        param_counter = 1
        
        # Build WHERE clause for location filter
        location_filter = ""
        if location_id:
            location_filter = f"AND i.location_id = ${param_counter}"
            params.append(location_id)
            param_counter += 1
        
        sql = f"""
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                p.category,
                p.subcategory,
                p.state,
                p.outsourced,
                COALESCE(SUM(i.inventory_qty), 0) as total_inventory,
                COUNT(DISTINCT i.location_id) as locations_count,
                STRING_AGG(DISTINCT i.location_id, ', ') as location_ids
            FROM products p
            LEFT JOIN inventory i ON p.product_id = i.product_id {location_filter}
            WHERE NOT EXISTS (
                SELECT 1
                FROM transactions t
                WHERE t.product_id = p.product_id
                  AND t.transaction_type = 'SALE'
                  AND t.date >= ${param_counter}
                  AND t.date < ${param_counter + 1}
            )
              AND p.state = true
            GROUP BY p.product_id, p.product_name, p.brand, p.category, p.subcategory, p.state, p.outsourced
            HAVING COALESCE(SUM(i.inventory_qty), 0) > 0
            ORDER BY total_inventory DESC
            LIMIT ${param_counter + 2}
        """
        
        # Convert strings to date objects for PostgreSQL
        from datetime import datetime
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        params.extend([start_date_obj, end_date_obj, top_n])
        
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
                    location_msg = f" en location {location_id}" if location_id else ""
                    return json.dumps({
                        "found": False,
                        "message": f"No se encontraron productos sin venta en el periodo{location_msg}",
                        "products": []
                    })
                
                products = []
                for row in rows:
                    products.append({
                        "product_id": row['product_id'],
                        "product_name": row['product_name'],
                        "brand": row['brand'] if row['brand'] else 'N/A',
                        "category": row['category'] if row['category'] else 'N/A',
                        "subcategory": row['subcategory'] if row['subcategory'] else 'N/A',
                        "state": "ACTIVO" if row['state'] else "INACTIVO",
                        "outsourced": "SI" if row['outsourced'] else "NO",
                        "total_inventory": int(row['total_inventory']),
                        "locations_count": int(row['locations_count']),
                        "location_ids": row['location_ids'] if row['location_ids'] else 'N/A'
                    })
                
                location_info = f" en location {location_id}" if location_id else " en todas las locations"
                
                result = {
                    "found": True,
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date
                    },
                    "location_filter": location_id if location_id else "all",
                    "total_products": len(products),
                    "products": products,
                    "summary": f"Se encontraron {len(products)} productos sin ventas{location_info} en el periodo"
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_products_not_sold


def create_product_period_comparison_tool(queries_executed: List[Dict]):
    """Tool to compare product sales between two periods"""
    
    @tool
    async def get_product_period_comparison(
        current_start_date: str,
        current_end_date: str,
        comparison_start_date: str,
        comparison_end_date: str,
        category: Optional[str] = None,
        product_id: Optional[str] = None,
        filter_trend: Optional[str] = None,
        top_n: int = 50
    ) -> str:
        """
        Compare product sales between two time periods to identify growth or decline.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué productos están creciendo/decreciendo vs [periodo]?"
        - "Productos con crecimiento vs mes/trimestre/año pasado"
        - "Comparar ventas de productos entre periodos"
        - "¿Cuáles productos vienen decreciendo?"
        
        **IMPORTANT:** Agent calculates the dates. Examples:
        - "vs mes pasado" → current: 2025-12-01 to 2025-12-31, comparison: 2025-11-01 to 2025-11-30
        - "vs trimestre pasado" → current: Q4 2025, comparison: Q3 2025
        - "vs año pasado" → current: 2025-12-01 to 2025-12-31, comparison: 2024-12-01 to 2024-12-31
        
        Args:
            current_start_date: Start date of current period (YYYY-MM-DD)
            current_end_date: End date of current period (YYYY-MM-DD)
            comparison_start_date: Start date of comparison period (YYYY-MM-DD)
            comparison_end_date: End date of comparison period (YYYY-MM-DD)
            category: Filter by product category (optional)
            product_id: Filter by specific product (optional)
            filter_trend: 'growing', 'declining', or None for all (optional)
            top_n: Number of products to return (default 50)
        
        Returns:
            JSON with products, sales in both periods, and growth/decline metrics
        """
        from datetime import datetime
        
        # Convert strings to date objects
        try:
            current_start = datetime.strptime(current_start_date, '%Y-%m-%d').date()
            current_end = datetime.strptime(current_end_date, '%Y-%m-%d').date()
            comparison_start = datetime.strptime(comparison_start_date, '%Y-%m-%d').date()
            comparison_end = datetime.strptime(comparison_end_date, '%Y-%m-%d').date()
        except ValueError as e:
            return json.dumps({"error": f"Invalid date format: {str(e)}. Use YYYY-MM-DD"})
        
        # Build base params list
        params = [current_start, current_end, comparison_start, comparison_end]
        param_counter = 5
        
        # Build filters for WHERE clause
        filters = []
        if category:
            filters.append(f"p.category = ${param_counter}")
            params.append(category)
            param_counter += 1
        
        if product_id:
            filters.append(f"p.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        filter_clause = f"AND {' AND '.join(filters)}" if filters else ""
        
        # Save positions for filter_trend and top_n
        filter_trend_param = param_counter
        top_n_param = param_counter + 1
        
        # Add to params list
        params.append(filter_trend)
        params.append(top_n)
        
        sql = f"""
            WITH current_sales AS (
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.brand,
                    p.category,
                    p.subcategory,
                    SUM(t.net_amount) as sales,
                    SUM(t.quantity) as quantity
                FROM transactions t
                JOIN products p ON t.product_id = p.product_id
                WHERE t.transaction_type = 'SALE'
                  AND t.date >= $1
                  AND t.date <= $2
                  {filter_clause}
                GROUP BY p.product_id, p.product_name, p.brand, p.category, p.subcategory
            ),
            comparison_sales AS (
                SELECT 
                    p.product_id,
                    SUM(t.net_amount) as sales,
                    SUM(t.quantity) as quantity
                FROM transactions t
                JOIN products p ON t.product_id = p.product_id
                WHERE t.transaction_type = 'SALE'
                  AND t.date >= $3
                  AND t.date <= $4
                  {filter_clause}
                GROUP BY p.product_id
            )
            SELECT 
                c.product_id,
                c.product_name,
                c.brand,
                c.category,
                c.subcategory,
                c.sales as current_sales,
                c.quantity as current_quantity,
                COALESCE(cmp.sales, 0) as comparison_sales,
                COALESCE(cmp.quantity, 0) as comparison_quantity,
                c.sales - COALESCE(cmp.sales, 0) as sales_difference,
                CASE 
                    WHEN COALESCE(cmp.sales, 0) > 0 
                    THEN ((c.sales - cmp.sales) / cmp.sales * 100)
                    ELSE 0
                END as growth_rate_pct,
                CASE 
                    WHEN COALESCE(cmp.sales, 0) = 0 THEN 'new'
                    WHEN ((c.sales - cmp.sales) / cmp.sales * 100) > 5 THEN 'growing'
                    WHEN ((c.sales - cmp.sales) / cmp.sales * 100) < -5 THEN 'declining'
                    ELSE 'stable'
                END as trend
            FROM current_sales c
            LEFT JOIN comparison_sales cmp ON c.product_id = cmp.product_id
            WHERE (${filter_trend_param}::text IS NULL OR 
                   CASE 
                       WHEN COALESCE(cmp.sales, 0) = 0 THEN 'new'
                       WHEN ((c.sales - cmp.sales) / cmp.sales * 100) > 5 THEN 'growing'
                       WHEN ((c.sales - cmp.sales) / cmp.sales * 100) < -5 THEN 'declining'
                       ELSE 'stable'
                   END = ${filter_trend_param}::text)
            ORDER BY growth_rate_pct DESC
            LIMIT ${top_n_param}
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
                    return json.dumps({
                        "found": False,
                        "message": "No se encontraron productos para comparar en los periodos especificados",
                        "products": []
                    })
                
                products = []
                for row in rows:
                    products.append({
                        "product_id": row['product_id'],
                        "product_name": row['product_name'],
                        "brand": row['brand'] if row['brand'] else 'N/A',
                        "category": row['category'] if row['category'] else 'N/A',
                        "subcategory": row['subcategory'] if row['subcategory'] else 'N/A',
                        "current_period": {
                            "sales": float(row['current_sales']),
                            "quantity": float(row['current_quantity'])
                        },
                        "comparison_period": {
                            "sales": float(row['comparison_sales']),
                            "quantity": float(row['comparison_quantity'])
                        },
                        "sales_difference": float(row['sales_difference']),
                        "growth_rate_pct": float(row['growth_rate_pct']),
                        "trend": row['trend']
                    })
                
                result = {
                    "found": True,
                    "current_period": {
                        "start_date": current_start_date,
                        "end_date": current_end_date
                    },
                    "comparison_period": {
                        "start_date": comparison_start_date,
                        "end_date": comparison_end_date
                    },
                    "filter_trend": filter_trend if filter_trend else "all",
                    "total_products": len(products),
                    "products": products
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_product_period_comparison


def create_client_performance_analysis_tool(queries_executed: List[Dict]):
    """Tool to analyze client performance with profitability and frequency metrics"""
    
    @tool
    async def get_client_performance_analysis(
        start_date: str,
        end_date: str,
        location_id: Optional[str] = None,
        client_group: Optional[str] = None,
        min_frequency: Optional[int] = None,
        max_daily_avg: Optional[float] = None,
        min_daily_avg: Optional[float] = None,
        sort_by: str = "profit",
        order: str = "desc",
        top_n: int = 50
    ) -> str:
        """
        Comprehensive client performance analysis including profitability, sales, and frequency.
        
        **USE THIS TOOL WHEN:**
        - "Clientes más/menos rentables" (most/least profitable clients)
        - "Clientes con mejor/peor margen" (clients with best/worst margin)
        - "Clientes que compran poco pero gasto bajo" (clients buying frequently but low amounts)
        - "Clientes semanales que compran por debajo de X dólares por día"
        - "Top clientes por ventas/ganancia/frecuencia"
        - "Performance de clientes en [periodo/location]"
        
        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            location_id: Optional location filter
            client_group: Optional client group filter
            min_frequency: Minimum purchases per week (optional)
            max_daily_avg: Maximum daily average sales (optional)
            min_daily_avg: Minimum daily average sales (optional)
            sort_by: "profit", "sales", "margin_pct", "frequency" (default: profit)
            order: "asc" or "desc" (default: desc)
            top_n: Number of results (default 50)
        
        Returns:
            JSON with client performance metrics including profitability, frequency, and segmentation
        """
        from datetime import datetime
        
        # Convert strings to date objects
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError as e:
            return json.dumps({"error": f"Invalid date format: {str(e)}. Use YYYY-MM-DD"})
        
        # Build params
        params = [start_date_obj, end_date_obj, location_id, client_group, 
                  min_frequency, max_daily_avg, min_daily_avg, sort_by, order, top_n]
        
        sql = """
            WITH date_range AS (
                SELECT 
                    $1::DATE as start_date,
                    $2::DATE as end_date,
                    ($2::DATE - $1::DATE) as total_days,
                    CEIL(($2::DATE - $1::DATE) / 7.0) as total_weeks
            ),
            client_sales AS (
                SELECT 
                    c.client_id,
                    c.client_name,
                    c.client_group,
                    c.city,
                    
                    COUNT(DISTINCT t.date) as purchase_days,
                    COUNT(DISTINCT DATE_TRUNC('week', t.date)) as purchase_weeks,
                    COUNT(*) as total_transactions,
                    
                    SUM(t.net_amount) as total_sales,
                    SUM(t.total_cost) as total_cost,
                    SUM(t.net_amount - t.total_cost) as total_profit,
                    
                    AVG(t.net_amount) as avg_transaction_value,
                    SUM(t.net_amount) / NULLIF(COUNT(DISTINCT t.date), 0) as avg_daily_sales,
                    SUM(t.net_amount) / NULLIF(COUNT(DISTINCT DATE_TRUNC('week', t.date)), 0) as avg_weekly_sales
                    
                FROM clients c
                INNER JOIN transactions t ON c.client_id = t.client_id
                WHERE t.transaction_type = 'SALE'
                  AND t.date >= $1::DATE
                  AND t.date <= $2::DATE
                  AND ($3::TEXT IS NULL OR t.location_id = $3)
                  AND ($4::TEXT IS NULL OR c.client_group = $4)
                GROUP BY c.client_id, c.client_name, c.client_group, c.city
            )
            SELECT 
                cs.client_id,
                cs.client_name,
                cs.client_group,
                cs.city,
                
                cs.purchase_days,
                cs.purchase_weeks,
                dr.total_days,
                dr.total_weeks,
                
                ROUND((cs.purchase_days::NUMERIC / NULLIF(dr.total_days, 0)), 3) as purchase_frequency_pct,
                ROUND((cs.purchase_weeks::NUMERIC / NULLIF(dr.total_weeks, 0)), 3) as weekly_purchase_rate,
                
                cs.total_transactions,
                cs.total_sales,
                cs.total_cost,
                cs.total_profit,
                
                CASE 
                    WHEN cs.total_sales > 0 
                    THEN ROUND((cs.total_profit / cs.total_sales * 100), 2)
                    ELSE 0
                END as profit_margin_pct,
                
                ROUND(cs.avg_transaction_value, 2) as avg_transaction_value,
                ROUND(cs.avg_daily_sales, 2) as avg_daily_sales,
                ROUND(cs.avg_weekly_sales, 2) as avg_weekly_sales,
                
                CASE 
                    WHEN cs.total_profit / NULLIF(cs.total_sales, 0) > 0.30 THEN 'high_margin'
                    WHEN cs.total_profit / NULLIF(cs.total_sales, 0) > 0.15 THEN 'medium_margin'
                    ELSE 'low_margin'
                END as margin_category,
                
                CASE 
                    WHEN cs.purchase_weeks::NUMERIC / NULLIF(dr.total_weeks, 0) >= 0.75 THEN 'very_frequent'
                    WHEN cs.purchase_weeks::NUMERIC / NULLIF(dr.total_weeks, 0) >= 0.5 THEN 'frequent'
                    WHEN cs.purchase_weeks::NUMERIC / NULLIF(dr.total_weeks, 0) >= 0.25 THEN 'occasional'
                    ELSE 'rare'
                END as frequency_category,
                
                CASE 
                    WHEN cs.total_sales > 50000 THEN 'vip'
                    WHEN cs.total_sales > 20000 THEN 'premium'
                    WHEN cs.total_sales > 5000 THEN 'standard'
                    ELSE 'low_value'
                END as value_segment

            FROM client_sales cs
            CROSS JOIN date_range dr

            WHERE 1=1
                AND ($5::INT IS NULL OR cs.purchase_weeks >= $5)
                AND ($6::NUMERIC IS NULL OR cs.avg_daily_sales <= $6)
                AND ($7::NUMERIC IS NULL OR cs.avg_daily_sales >= $7)

            ORDER BY 
                CASE 
                    WHEN $8 = 'profit' THEN cs.total_profit
                    WHEN $8 = 'sales' THEN cs.total_sales
                    WHEN $8 = 'margin_pct' THEN cs.total_profit / NULLIF(cs.total_sales, 0)
                    WHEN $8 = 'frequency' THEN cs.purchase_weeks::NUMERIC
                    ELSE cs.total_profit
                END * CASE WHEN $9 = 'desc' THEN -1 ELSE 1 END

            LIMIT $10
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
                    return json.dumps({
                        "found": False,
                        "message": "No se encontraron clientes en el periodo especificado",
                        "clients": []
                    })
                
                clients = []
                for row in rows:
                    clients.append({
                        "client_id": row['client_id'],
                        "client_name": row['client_name'],
                        "client_group": row['client_group'] if row['client_group'] else 'N/A',
                        "city": row['city'] if row['city'] else 'N/A',
                        "frequency": {
                            "purchase_days": int(row['purchase_days']),
                            "purchase_weeks": int(row['purchase_weeks']),
                            "total_days": int(row['total_days']),
                            "total_weeks": int(row['total_weeks']),
                            "purchase_frequency_pct": float(row['purchase_frequency_pct']),
                            "weekly_purchase_rate": float(row['weekly_purchase_rate']),
                            "category": row['frequency_category']
                        },
                        "financial": {
                            "total_transactions": int(row['total_transactions']),
                            "total_sales": float(row['total_sales']),
                            "total_cost": float(row['total_cost']),
                            "total_profit": float(row['total_profit']),
                            "profit_margin_pct": float(row['profit_margin_pct']),
                            "margin_category": row['margin_category']
                        },
                        "averages": {
                            "avg_transaction_value": float(row['avg_transaction_value']),
                            "avg_daily_sales": float(row['avg_daily_sales']),
                            "avg_weekly_sales": float(row['avg_weekly_sales'])
                        },
                        "value_segment": row['value_segment']
                    })
                
                total_days = int(rows[0]['total_days']) if rows else 0
                total_weeks = int(rows[0]['total_weeks']) if rows else 0
                
                result = {
                    "found": True,
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "total_days": total_days,
                        "total_weeks": total_weeks
                    },
                    "filters_applied": {
                        "location_id": location_id,
                        "client_group": client_group,
                        "min_frequency": min_frequency,
                        "max_daily_avg": max_daily_avg,
                        "min_daily_avg": min_daily_avg
                    },
                    "sort": {
                        "by": sort_by,
                        "order": order
                    },
                    "total_clients": len(clients),
                    "clients": clients
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_client_performance_analysis


def create_commercial_goals_performance_tool(queries_executed: List[Dict]):
    """Tool to analyze commercial goals (sales targets) vs actual sales performance by seller"""
    
    @tool
    async def get_commercial_goals_performance(
        year: int,
        month: Optional[int] = None,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None,
        commercial_id: Optional[str] = None,
        filter_status: Optional[str] = None,
        sort_by: str = "variance",
        top_n: int = 50
    ) -> str:
        """
        Analyze commercial goals (sales targets) vs actual sales performance by seller/commercial.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué vendedores están por debajo de sus metas?" (which sellers are below their goals)
        - "Vendedores que no alcanzaron su cuota" (sellers who didn't reach their quota)
        - "Performance de vendedores vs meta en septiembre" (seller performance vs goal in September)
        - "Ranking de vendedores vs meta asignada" (ranking of sellers vs assigned goal)
        - "Dame el cumplimiento de metas de vendedores" (seller goal achievement)
        - "Performance del último trimestre de vendedores" (last quarter seller performance)
        
        **CRITICAL WORKFLOWS:**
        1. Single month: use `year` and `month` parameters
        2. Multiple months/quarter: use `year`, `start_month`, and `end_month` parameters
        3. Full year: use only `year` parameter (analyzes entire year)
        4. Filter results: use `filter_status` ("below_goal", "above_goal", or None for all)
        5. Current date context: "último trimestre" = last 3 months from current date
        
        **IMPORTANT FILTERS:**
        - filter_status="below_goal" → shows only sellers below their goals
        - filter_status="above_goal" → shows only sellers meeting or exceeding goals
        - filter_status=None → shows all sellers
        
        **SORT OPTIONS:**
        - "variance" (default): Sort by gap (goal - actual), largest gaps first
        - "achievement_pct": Sort by achievement percentage
        - "actual_sales": Sort by actual sales amount
        - "goal": Sort by goal amount
        
        Args:
            year: Year to analyze (e.g., 2025)
            month: Single month to analyze (1-12), optional
            start_month: Start month for range analysis (1-12), optional
            end_month: End month for range analysis (1-12), optional
            commercial_id: Specific seller/commercial code to filter (optional)
            filter_status: Filter by performance - "below_goal", "above_goal", or None for all
            sort_by: Sort results by "variance", "achievement_pct", "actual_sales", or "goal"
            top_n: Number of results to return (default 50)
        
        Returns:
            JSON with sellers, their goals, actual sales, variance, and achievement %
        """
        params = []
        param_counter = 1
        
        # Determine date range based on parameters
        if month:
            # Single month
            date_start = f"DATE '{year}-{month:02d}-01'"
            if month == 12:
                date_end = f"DATE '{year + 1}-01-01'"
            else:
                date_end = f"DATE '{year}-{month + 1:02d}-01'"
            period_label = f"{year}-{month:02d}"
        elif start_month and end_month:
            # Month range (e.g., quarter)
            date_start = f"DATE '{year}-{start_month:02d}-01'"
            if end_month == 12:
                date_end = f"DATE '{year + 1}-01-01'"
            else:
                date_end = f"DATE '{year}-{end_month + 1:02d}-01'"
            period_label = f"{year}-{start_month:02d} to {year}-{end_month:02d}"
        else:
            # Full year
            date_start = f"DATE '{year}-01-01'"
            date_end = f"DATE '{year + 1}-01-01'"
            period_label = str(year)
        
        # Optional commercial filter
        commercial_filter = ""
        if commercial_id:
            commercial_filter = f"AND cg.commercial_id = ${param_counter}"
            params.append(commercial_id)
            param_counter += 1
        
        # Build query to compare commercial_goals vs transactions
        sql = f"""
            WITH goals_aggregated AS (
                SELECT
                    cg.commercial_id,
                    cg.commercial_name,
                    SUM(cg.goal) AS total_goal
                FROM commercial_goals cg
                WHERE cg.date >= {date_start}
                  AND cg.date < {date_end}
                  {commercial_filter}
                GROUP BY cg.commercial_id, cg.commercial_name
            ),
            sales_aggregated AS (
                SELECT
                    t.seller_code AS commercial_id,
                    SUM(t.net_amount) AS total_sales
                FROM transactions t
                WHERE t.date >= {date_start}
                  AND t.date < {date_end}
                  AND t.transaction_type = 'SALE'
                GROUP BY t.seller_code
            )
            SELECT
                COALESCE(g.commercial_id, s.commercial_id) AS commercial_id,
                g.commercial_name,
                COALESCE(g.total_goal, 0) AS goal,
                COALESCE(s.total_sales, 0) AS actual_sales,
                COALESCE(g.total_goal, 0) - COALESCE(s.total_sales, 0) AS variance,
                CASE 
                    WHEN COALESCE(g.total_goal, 0) > 0 
                    THEN (COALESCE(s.total_sales, 0) / COALESCE(g.total_goal, 0) * 100)
                    ELSE 0
                END AS achievement_pct,
                CASE 
                    WHEN COALESCE(g.total_goal, 0) > COALESCE(s.total_sales, 0) THEN 'below_goal'
                    WHEN COALESCE(g.total_goal, 0) < COALESCE(s.total_sales, 0) THEN 'above_goal'
                    ELSE 'on_goal'
                END AS status
            FROM goals_aggregated g
            FULL OUTER JOIN sales_aggregated s ON s.commercial_id = g.commercial_id
            WHERE 1=1
                {"AND COALESCE(g.total_goal, 0) > COALESCE(s.total_sales, 0)" if filter_status == "below_goal" else ""}
                {"AND COALESCE(g.total_goal, 0) <= COALESCE(s.total_sales, 0)" if filter_status == "above_goal" else ""}
            ORDER BY 
                CASE 
                    WHEN '{sort_by}' = 'variance' THEN COALESCE(g.total_goal, 0) - COALESCE(s.total_sales, 0)
                    WHEN '{sort_by}' = 'achievement_pct' THEN CASE WHEN COALESCE(g.total_goal, 0) > 0 THEN (COALESCE(s.total_sales, 0) / COALESCE(g.total_goal, 0) * 100) ELSE 0 END
                    WHEN '{sort_by}' = 'actual_sales' THEN COALESCE(s.total_sales, 0)
                    WHEN '{sort_by}' = 'goal' THEN COALESCE(g.total_goal, 0)
                    ELSE COALESCE(g.total_goal, 0) - COALESCE(s.total_sales, 0)
                END DESC
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
                    return json.dumps({
                        "found": False,
                        "message": f"No se encontraron datos de metas comerciales para el periodo {period_label}",
                        "results": []
                    })
                
                results = []
                for row in rows:
                    results.append({
                        "commercial_id": row['commercial_id'],
                        "commercial_name": row['commercial_name'] or 'N/A',
                        "goal": float(row['goal']),
                        "actual_sales": float(row['actual_sales']),
                        "variance": float(row['variance']),
                        "achievement_pct": float(row['achievement_pct']),
                        "status": row['status']
                    })
                
                result = {
                    "found": True,
                    "period": period_label,
                    "filter_status": filter_status or "all",
                    "sort_by": sort_by,
                    "total_results": len(results),
                    "results": results
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_commercial_goals_performance


def create_commercial_goals_by_month_tool(queries_executed: List[Dict]):
    """Tool to analyze commercial goals performance by seller broken down by month"""
    
    @tool
    async def get_commercial_goals_by_month(
        year: int,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None,
        commercial_id: Optional[str] = None,
        top_n: int = 20
    ) -> str:
        """
        Get commercial goals performance by seller BROKEN DOWN BY EACH MONTH (time series).
        
        **USE THIS TOOL WHEN:**
        - "Performance mensual de vendedores vs meta" (monthly seller performance vs goal)
        - "Cumplimiento de metas mes a mes" (goal achievement month by month)
        - "Dame el desempeño de vendedores por mes" (seller performance by month)
        - "Evolución mensual de cumplimiento de metas" (monthly evolution of goal achievement)
        - "Comparar meses de vendedores" (compare seller months)
        
        **DO NOT USE WHEN:**
        - User wants ONE TOTAL for a period → use get_commercial_goals_performance instead
        - User wants to see ALL sellers ranked for ONE period → use get_commercial_goals_performance
        
        **CRITICAL:**
        - Returns data for EACH MONTH SEPARATELY
        - Useful for trending and time-series analysis
        - Shows how sellers perform over time
        
        Args:
            year: Year to analyze (e.g., 2025)
            start_month: Start month (1-12), defaults to January
            end_month: End month (1-12), defaults to December
            commercial_id: Specific seller/commercial code to filter (optional)
            top_n: Number of top sellers to include (default 20)
        
        Returns:
            JSON with monthly breakdown of goals vs actual sales by seller
        """
        params = []
        param_counter = 1
        
        # Default to full year if not specified
        start_month = start_month or 1
        end_month = end_month or 12
        
        date_start = f"DATE '{year}-{start_month:02d}-01'"
        if end_month == 12:
            date_end = f"DATE '{year + 1}-01-01'"
        else:
            date_end = f"DATE '{year}-{end_month + 1:02d}-01'"
        
        # Optional commercial filter
        commercial_filter = ""
        if commercial_id:
            commercial_filter = f"AND cg.commercial_id = ${param_counter}"
            params.append(commercial_id)
            param_counter += 1
        
        sql = f"""
            WITH goals_by_month AS (
                SELECT
                    cg.commercial_id,
                    cg.commercial_name,
                    cg.date AS month_date,
                    EXTRACT(YEAR FROM cg.date) AS year,
                    EXTRACT(MONTH FROM cg.date) AS month,
                    SUM(cg.goal) AS goal
                FROM commercial_goals cg
                WHERE cg.date >= {date_start}
                  AND cg.date < {date_end}
                  {commercial_filter}
                GROUP BY cg.commercial_id, cg.commercial_name, cg.date
            ),
            sales_by_month AS (
                SELECT
                    t.seller_code AS commercial_id,
                    DATE_TRUNC('month', t.date) AS month_date,
                    SUM(t.net_amount) AS sales
                FROM transactions t
                WHERE t.date >= {date_start}
                  AND t.date < {date_end}
                  AND t.transaction_type = 'SALE'
                GROUP BY t.seller_code, DATE_TRUNC('month', t.date)
            ),
            top_sellers AS (
                SELECT DISTINCT
                    cg.commercial_id,
                    cg.commercial_name,
                    SUM(cg.goal) OVER (PARTITION BY cg.commercial_id) AS total_goal
                FROM commercial_goals cg
                WHERE cg.date >= {date_start}
                  AND cg.date < {date_end}
                  {commercial_filter}
                ORDER BY total_goal DESC
                LIMIT {top_n}
            )
            SELECT
                ts.commercial_id,
                ts.commercial_name,
                TO_CHAR(COALESCE(g.month_date, s.month_date), 'YYYY-MM') AS month,
                COALESCE(g.goal, 0) AS goal,
                COALESCE(s.sales, 0) AS actual_sales,
                COALESCE(g.goal, 0) - COALESCE(s.sales, 0) AS variance,
                CASE 
                    WHEN COALESCE(g.goal, 0) > 0 
                    THEN (COALESCE(s.sales, 0) / COALESCE(g.goal, 0) * 100)
                    ELSE 0
                END AS achievement_pct,
                CASE 
                    WHEN COALESCE(g.goal, 0) > COALESCE(s.sales, 0) THEN 'below_goal'
                    WHEN COALESCE(g.goal, 0) < COALESCE(s.sales, 0) THEN 'above_goal'
                    ELSE 'on_goal'
                END AS status
            FROM top_sellers ts
            LEFT JOIN goals_by_month g 
                ON g.commercial_id = ts.commercial_id
            LEFT JOIN sales_by_month s 
                ON s.commercial_id = ts.commercial_id 
                AND s.month_date = g.month_date
            WHERE COALESCE(g.month_date, s.month_date) IS NOT NULL
            ORDER BY ts.total_goal DESC, ts.commercial_id, month
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
                    return json.dumps({
                        "found": False,
                        "message": f"No se encontraron datos de metas comerciales mensuales para {year}",
                        "results": []
                    })
                
                # Group results by seller
                sellers_data = {}
                for row in rows:
                    commercial_id = row['commercial_id']
                    if commercial_id not in sellers_data:
                        sellers_data[commercial_id] = {
                            "commercial_id": commercial_id,
                            "commercial_name": row['commercial_name'] or 'N/A',
                            "months": []
                        }
                    
                    sellers_data[commercial_id]["months"].append({
                        "month": row['month'],
                        "goal": float(row['goal']),
                        "actual_sales": float(row['actual_sales']),
                        "variance": float(row['variance']),
                        "achievement_pct": float(row['achievement_pct']),
                        "status": row['status']
                    })
                
                result = {
                    "found": True,
                    "period": f"{year}-{start_month:02d} to {year}-{end_month:02d}",
                    "total_sellers": len(sellers_data),
                    "sellers": list(sellers_data.values())
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_commercial_goals_by_month


def create_sales_health_tool(queries_executed: List[Dict]):
    """Tool for monthly sales health monitoring (MTD - Month To Date)"""
    
    @tool
    async def get_sales_health(
        year: Optional[int] = None,
        month: Optional[int] = None,
        location_id: Optional[str] = None
    ) -> str:
        """
        MANDATORY TOOL for sales health/check/status queries. ALWAYS call this tool when user mentions "sales" + "health"/"check"/"status"/"report".
        
        REQUIRED for: "sales health", "salud de ventas", "sales check", "estado de ventas",
        "how are sales", "cómo van las ventas", "sales report", "sales dashboard"
        
        DO NOT respond to these queries without calling this tool first.
        DO NOT invent sales data - use this tool to get real data.
        
        Args:
            year: Optional year (defaults to most recent)
            month: Optional month 1-12 (defaults to most recent)
            location_id: Optional location filter
        
        Returns: JSON with monthly sales metrics, profit margins, comparisons, top products/clients, alerts
        """
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta
        
        pool = await get_client_db_pool()
        
        # First, find the most recent month with data
        try:
            async with pool.acquire() as conn:
                latest_data = await conn.fetchrow("""
                    SELECT 
                        EXTRACT(YEAR FROM MAX(date))::int as latest_year,
                        EXTRACT(MONTH FROM MAX(date))::int as latest_month
                    FROM transactions
                    WHERE transaction_type = 'SALE'
                """)
                
                if not latest_data or not latest_data['latest_year']:
                    return json.dumps({
                        "has_data": False,
                        "message": "No sales data available in the database."
                    })
                
                # Use provided year/month or default to latest available
                target_year = year if year else latest_data['latest_year']
                target_month = month if month else latest_data['latest_month']
        except Exception as e:
            await pool.close()
            raise e
        
        # Calculate date ranges
        month_start = datetime(target_year, target_month, 1).date()
        if target_month == 12:
            month_end = datetime(target_year + 1, 1, 1).date() - timedelta(days=1)
        else:
            month_end = datetime(target_year, target_month + 1, 1).date() - timedelta(days=1)
        
        # Previous month
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        prev_month_end = month_start - timedelta(days=1)
        
        # Same month last year
        try:
            same_month_last_year_start = datetime(target_year - 1, target_month, 1).date()
            if target_month == 12:
                same_month_last_year_end = datetime(target_year, 1, 1).date() - timedelta(days=1)
            else:
                same_month_last_year_end = datetime(target_year - 1, target_month + 1, 1).date() - timedelta(days=1)
        except:
            same_month_last_year_start = None
            same_month_last_year_end = None
        
        # Build location filter if provided
        location_filter = ""
        if location_id:
            location_filter = f"AND t.location_id = '{location_id}'"
        
        # Query 1: Current month sales (MTD)
        sql_current_month = f"""
            SELECT 
                COALESCE(SUM(t.net_amount), 0) as total_sales,
                COALESCE(SUM(t.quantity), 0) as total_quantity,
                COUNT(DISTINCT t.client_id) as unique_clients,
                COUNT(DISTINCT DATE(t.date)) as days_with_sales,
                COUNT(*) as transaction_count,
                COALESCE(SUM(t.net_amount - (t.unit_cost * t.quantity)), 0) as total_profit,
                CASE 
                    WHEN SUM(t.unit_cost * t.quantity) > 0 
                    THEN ((SUM(t.net_amount - (t.unit_cost * t.quantity)) / SUM(t.unit_cost * t.quantity)) * 100)
                    ELSE 0
                END as profit_margin_pct
            FROM transactions t
            WHERE t.date >= $1
              AND t.date <= $2
              AND t.transaction_type = 'SALE'
              {location_filter}
        """
        
        # Query 2: Previous month sales
        sql_prev_month = f"""
            SELECT 
                COALESCE(SUM(t.net_amount), 0) as total_sales,
                COUNT(DISTINCT DATE(t.date)) as days_with_sales
            FROM transactions t
            WHERE t.date >= $1
              AND t.date <= $2
              AND t.transaction_type = 'SALE'
              {location_filter}
        """
        
        # Query 3: Same month last year
        sql_same_month_last_year = f"""
            SELECT 
                COALESCE(SUM(t.net_amount), 0) as total_sales,
                COUNT(DISTINCT DATE(t.date)) as days_with_sales
            FROM transactions t
            WHERE t.date >= $1
              AND t.date <= $2
              AND t.transaction_type = 'SALE'
              {location_filter}
        """
        
        # Query 4: Top products this month
        sql_top_products = f"""
            SELECT 
                p.product_name,
                p.brand,
                SUM(t.quantity) as quantity,
                SUM(t.net_amount) as sales
            FROM transactions t
            JOIN products p ON t.product_id = p.product_id
            WHERE t.date >= $1
              AND t.date <= $2
              AND t.transaction_type = 'SALE'
              {location_filter}
            GROUP BY p.product_name, p.brand
            ORDER BY sales DESC
            LIMIT 5
        """
        
        # Query 5: Top clients this month
        sql_top_clients = f"""
            SELECT 
                c.client_name,
                c.client_group,
                SUM(t.net_amount) as sales,
                COUNT(*) as transactions
            FROM transactions t
            JOIN clients c ON t.client_id = c.client_id
            WHERE t.date >= $1
              AND t.date <= $2
              AND t.transaction_type = 'SALE'
              {location_filter}
            GROUP BY c.client_name, c.client_group
            ORDER BY sales DESC
            LIMIT 5
        """
        
        queries_executed.append({
            "type": "sql_health_check",
            "database": "client_data",
            "query": "sales_health_monthly",
            "source": "simple_agent_tool"
        })
        
        try:
            async with pool.acquire() as conn:
                # Execute all queries with their respective date ranges
                current_month_data = await conn.fetchrow(sql_current_month, month_start, month_end)
                prev_month_data = await conn.fetchrow(sql_prev_month, prev_month_start, prev_month_end)
                
                same_month_last_year_data = None
                if same_month_last_year_start:
                    same_month_last_year_data = await conn.fetchrow(sql_same_month_last_year, same_month_last_year_start, same_month_last_year_end)
                
                top_products = await conn.fetch(sql_top_products, month_start, month_end)
                top_clients = await conn.fetch(sql_top_clients, month_start, month_end)
                
                # Calculate totals
                current_month_sales = float(current_month_data['total_sales']) if current_month_data['total_sales'] else 0.0
                prev_month_sales = float(prev_month_data['total_sales']) if prev_month_data['total_sales'] else 0.0
                same_month_last_year_sales = float(same_month_last_year_data['total_sales']) if same_month_last_year_data and same_month_last_year_data['total_sales'] else 0.0
                
                days_with_sales = int(current_month_data['days_with_sales']) if current_month_data['days_with_sales'] else 0
                prev_month_days = int(prev_month_data['days_with_sales']) if prev_month_data['days_with_sales'] else 0
                
                # CRITICAL: Check if there's any data for this month
                has_data = current_month_data and (current_month_data['transaction_count'] is not None and int(current_month_data['transaction_count']) > 0)
                
                if not has_data:
                    return json.dumps({
                        "year": target_year,
                        "month": target_month,
                        "has_data": False,
                        "message": f"No sales data available for {target_year}-{target_month:02d}."
                    })
                
                # Calculate comparisons
                vs_prev_month_pct = ((current_month_sales - prev_month_sales) / prev_month_sales * 100) if prev_month_sales > 0 else 0
                vs_same_month_last_year_pct = ((current_month_sales - same_month_last_year_sales) / same_month_last_year_sales * 100) if same_month_last_year_sales > 0 else 0
                
                # Calculate daily averages
                daily_avg_current = current_month_sales / days_with_sales if days_with_sales > 0 else 0
                daily_avg_prev = prev_month_sales / prev_month_days if prev_month_days > 0 else 0
                
                # Generate alerts (data only, no text)
                alerts = []
                if vs_prev_month_pct < -10:
                    alerts.append({
                        "type": "warning",
                        "metric": "sales_decrease_vs_prev_month",
                        "value": abs(vs_prev_month_pct)
                    })
                elif vs_prev_month_pct > 15:
                    alerts.append({
                        "type": "success",
                        "metric": "sales_increase_vs_prev_month",
                        "value": vs_prev_month_pct
                    })
                
                if current_month_data['profit_margin_pct'] and float(current_month_data['profit_margin_pct']) < 15:
                    alerts.append({
                        "type": "warning",
                        "metric": "low_profit_margin",
                        "value": float(current_month_data['profit_margin_pct'])
                    })
                
                if vs_same_month_last_year_pct < -15 and same_month_last_year_sales > 0:
                    alerts.append({
                        "type": "warning",
                        "metric": "sales_decrease_vs_last_year",
                        "value": abs(vs_same_month_last_year_pct)
                    })
                
                # Build result
                result = {
                    "year": target_year,
                    "month": target_month,
                    "period": f"{target_year}-{target_month:02d}",
                    "has_data": True,
                    "summary": {
                        "total_sales": current_month_sales,
                        "total_quantity": int(current_month_data['total_quantity']) if current_month_data['total_quantity'] else 0,
                        "unique_clients": int(current_month_data['unique_clients']) if current_month_data['unique_clients'] else 0,
                        "transaction_count": int(current_month_data['transaction_count']) if current_month_data['transaction_count'] else 0,
                        "days_with_sales": days_with_sales,
                        "total_profit": float(current_month_data['total_profit']) if current_month_data['total_profit'] else 0.0,
                        "profit_margin_pct": float(current_month_data['profit_margin_pct']) if current_month_data['profit_margin_pct'] else 0.0,
                        "avg_transaction_value": current_month_sales / int(current_month_data['transaction_count']) if current_month_data['transaction_count'] and int(current_month_data['transaction_count']) > 0 else 0,
                        "daily_average": daily_avg_current
                    },
                    "comparisons": {
                        "vs_prev_month": {
                            "amount": prev_month_sales,
                            "change_pct": vs_prev_month_pct,
                            "trend": "up" if vs_prev_month_pct > 0 else "down" if vs_prev_month_pct < 0 else "flat",
                            "daily_avg": daily_avg_prev,
                            "daily_avg_change_pct": ((daily_avg_current - daily_avg_prev) / daily_avg_prev * 100) if daily_avg_prev > 0 else 0
                        },
                        "vs_same_month_last_year": {
                            "amount": same_month_last_year_sales,
                            "change_pct": vs_same_month_last_year_pct,
                            "trend": "up" if vs_same_month_last_year_pct > 0 else "down" if vs_same_month_last_year_pct < 0 else "flat"
                        } if same_month_last_year_sales > 0 else None
                    },
                    "top_products": [
                        {
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "quantity": int(row['quantity']) if row['quantity'] else 0,
                            "sales": float(row['sales']) if row['sales'] else 0.0,
                            "pct_of_total": (float(row['sales']) / current_month_sales * 100) if current_month_sales > 0 and row['sales'] else 0
                        }
                        for row in top_products
                    ],
                    "top_clients": [
                        {
                            "client_name": row['client_name'],
                            "client_group": row['client_group'],
                            "sales": float(row['sales']) if row['sales'] else 0.0,
                            "transactions": int(row['transactions']) if row['transactions'] else 0,
                            "pct_of_total": (float(row['sales']) / current_month_sales * 100) if current_month_sales > 0 and row['sales'] else 0
                        }
                        for row in top_clients
                    ],
                    "alerts": alerts
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_health


def create_backorder_health_tool(queries_executed: List[Dict]):
    """Tool for monthly backorder health monitoring"""
    
    @tool
    async def get_backorder_health(
        year: Optional[int] = None,
        month: Optional[int] = None,
        location_id: Optional[str] = None
    ) -> str:
        """
        MANDATORY TOOL for backorder health/check/status queries. ALWAYS call this tool when user mentions "backorder" + "health"/"check"/"status"/"report".
        
        REQUIRED for: "backorder health", "salud de backorder", "backorder check", "estado de backorder", 
        "run backorder health check", "how is backorder", "cómo está el backorder", "backorder report", "backorder dashboard"
        
        DO NOT respond to these queries without calling this tool first.
        DO NOT invent backorder data - use this tool to get real data.
        
        Args:
            year: Optional year (defaults to most recent)
            month: Optional month 1-12 (defaults to most recent)
            location_id: Optional location filter
        
        Returns: JSON with monthly backorder metrics, comparisons, top products/clients, aging analysis, alerts
        """
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta
        
        pool = await get_client_db_pool()
        
        # First, find the most recent month with backorder data
        try:
            async with pool.acquire() as conn:
                latest_data = await conn.fetchrow("""
                    SELECT 
                        EXTRACT(YEAR FROM MAX(date))::int as latest_year,
                        EXTRACT(MONTH FROM MAX(date))::int as latest_month
                    FROM backorder
                    WHERE backorder_qty > 0
                """)
                
                if not latest_data or not latest_data['latest_year']:
                    return json.dumps({
                        "has_data": False,
                        "message": "No backorder data available in the database."
                    })
                
                # Use provided year/month or default to latest available
                target_year = year if year else latest_data['latest_year']
                target_month = month if month else latest_data['latest_month']
        except Exception as e:
            await pool.close()
            raise e
        
        # Calculate date ranges
        month_start = datetime(target_year, target_month, 1).date()
        if target_month == 12:
            month_end = datetime(target_year + 1, 1, 1).date() - timedelta(days=1)
        else:
            month_end = datetime(target_year, target_month + 1, 1).date() - timedelta(days=1)
        
        # Previous month
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        prev_month_end = month_start - timedelta(days=1)
        
        # Same month last year
        try:
            same_month_last_year_start = datetime(target_year - 1, target_month, 1).date()
            if target_month == 12:
                same_month_last_year_end = datetime(target_year, 1, 1).date() - timedelta(days=1)
            else:
                same_month_last_year_end = datetime(target_year - 1, target_month + 1, 1).date() - timedelta(days=1)
        except:
            same_month_last_year_start = None
            same_month_last_year_end = None
        
        # Build location filter if provided
        location_filter = ""
        if location_id:
            location_filter = f"AND b.location_id = '{location_id}'"
        
        # Query 1: Current month backorder
        sql_current_month = f"""
            SELECT 
                COALESCE(SUM(b.backorder_qty), 0) as total_qty,
                COALESCE(SUM(b.total), 0) as total_value,
                COUNT(DISTINCT b.product_id) as unique_products,
                COUNT(DISTINCT b.client_id) as unique_clients,
                COUNT(*) as order_count,
                AVG(b.days_delayed) as avg_days_delayed
            FROM backorder b
            WHERE b.date >= $1
              AND b.date <= $2
              AND b.backorder_qty > 0
              {location_filter}
        """
        
        # Query 2: Previous month backorder
        sql_prev_month = f"""
            SELECT 
                COALESCE(SUM(b.backorder_qty), 0) as total_qty,
                COALESCE(SUM(b.total), 0) as total_value
            FROM backorder b
            WHERE b.date >= $1
              AND b.date <= $2
              AND b.backorder_qty > 0
              {location_filter}
        """
        
        # Query 3: Same month last year
        sql_same_month_last_year = f"""
            SELECT 
                COALESCE(SUM(b.backorder_qty), 0) as total_qty,
                COALESCE(SUM(b.total), 0) as total_value
            FROM backorder b
            WHERE b.date >= $1
              AND b.date <= $2
              AND b.backorder_qty > 0
              {location_filter}
        """
        
        # Query 4: Top products this month
        sql_top_products = f"""
            SELECT 
                p.product_name,
                p.brand,
                SUM(b.backorder_qty) as quantity,
                SUM(b.total) as value,
                AVG(b.days_delayed) as avg_days_delayed
            FROM backorder b
            JOIN products p ON b.product_id = p.product_id
            WHERE b.date >= $1
              AND b.date <= $2
              AND b.backorder_qty > 0
              {location_filter}
            GROUP BY p.product_name, p.brand
            ORDER BY quantity DESC
            LIMIT 5
        """
        
        # Query 5: Top clients this month
        sql_top_clients = f"""
            SELECT 
                c.client_name,
                c.client_group,
                SUM(b.backorder_qty) as quantity,
                SUM(b.total) as value,
                COUNT(*) as orders
            FROM backorder b
            JOIN clients c ON b.client_id = c.client_id
            WHERE b.date >= $1
              AND b.date <= $2
              AND b.backorder_qty > 0
              {location_filter}
            GROUP BY c.client_name, c.client_group
            ORDER BY value DESC
            LIMIT 5
        """
        
        # Query 6: Aging analysis
        sql_aging = f"""
            SELECT 
                age_bucket,
                order_count,
                quantity,
                value
            FROM (
                SELECT 
                    CASE 
                        WHEN b.days_delayed <= 7 THEN '0-7 days'
                        WHEN b.days_delayed <= 14 THEN '8-14 days'
                        WHEN b.days_delayed <= 30 THEN '15-30 days'
                        ELSE '30+ days'
                    END as age_bucket,
                    CASE 
                        WHEN b.days_delayed <= 7 THEN 1
                        WHEN b.days_delayed <= 14 THEN 2
                        WHEN b.days_delayed <= 30 THEN 3
                        ELSE 4
                    END as sort_order,
                    COUNT(*) as order_count,
                    SUM(b.backorder_qty) as quantity,
                    SUM(b.total) as value
                FROM backorder b
                WHERE b.date >= $1
                  AND b.date <= $2
                  AND b.backorder_qty > 0
                  {location_filter}
                GROUP BY 
                    CASE 
                        WHEN b.days_delayed <= 7 THEN '0-7 days'
                        WHEN b.days_delayed <= 14 THEN '8-14 days'
                        WHEN b.days_delayed <= 30 THEN '15-30 days'
                        ELSE '30+ days'
                    END,
                    CASE 
                        WHEN b.days_delayed <= 7 THEN 1
                        WHEN b.days_delayed <= 14 THEN 2
                        WHEN b.days_delayed <= 30 THEN 3
                        ELSE 4
                    END
            ) sub
            ORDER BY sort_order
        """
        
        queries_executed.append({
            "type": "sql_health_check",
            "database": "client_data",
            "query": "backorder_health_monthly",
            "source": "simple_agent_tool"
        })
        
        print(f"\n{'='*70}")
        print(f"[BACKORDER HEALTH] Executing for {target_year}-{target_month:02d}")
        print(f"  Month range: {month_start} to {month_end}")
        print(f"  Prev month: {prev_month_start} to {prev_month_end}")
        print(f"  Location filter: {location_filter if location_filter else 'None'}")
        print(f"{'='*70}\n")
        
        try:
            async with pool.acquire() as conn:
                # Execute all queries with their respective date ranges
                print("[BACKORDER HEALTH] Executing queries...")
                current_month_data = await conn.fetchrow(sql_current_month, month_start, month_end)
                print(f"  ✓ Current month data: {current_month_data['order_count'] if current_month_data else 0} orders")
                
                prev_month_data = await conn.fetchrow(sql_prev_month, prev_month_start, prev_month_end)
                print(f"  ✓ Prev month data: fetched")
                
                same_month_last_year_data = None
                if same_month_last_year_start:
                    same_month_last_year_data = await conn.fetchrow(sql_same_month_last_year, same_month_last_year_start, same_month_last_year_end)
                    print(f"  ✓ Same month last year: fetched")
                
                top_products = await conn.fetch(sql_top_products, month_start, month_end)
                print(f"  ✓ Top products: {len(top_products)} found")
                
                top_clients = await conn.fetch(sql_top_clients, month_start, month_end)
                print(f"  ✓ Top clients: {len(top_clients)} found")
                
                aging_data = await conn.fetch(sql_aging, month_start, month_end)
                print(f"  ✓ Aging data: {len(aging_data)} buckets")
                
                # Calculate totals
                current_month_qty = float(current_month_data['total_qty']) if current_month_data['total_qty'] else 0.0
                current_month_value = float(current_month_data['total_value']) if current_month_data['total_value'] else 0.0
                prev_month_qty = float(prev_month_data['total_qty']) if prev_month_data['total_qty'] else 0.0
                prev_month_value = float(prev_month_data['total_value']) if prev_month_data['total_value'] else 0.0
                same_month_last_year_qty = float(same_month_last_year_data['total_qty']) if same_month_last_year_data and same_month_last_year_data['total_qty'] else 0.0
                same_month_last_year_value = float(same_month_last_year_data['total_value']) if same_month_last_year_data and same_month_last_year_data['total_value'] else 0.0
                
                # CRITICAL: Check if there's any data for this month
                has_data = current_month_data and (current_month_data['order_count'] is not None and int(current_month_data['order_count']) > 0)
                
                if not has_data:
                    return json.dumps({
                        "year": target_year,
                        "month": target_month,
                        "has_data": False,
                        "message": f"No backorder data available for {target_year}-{target_month:02d}."
                    })
                
                # Calculate comparisons
                vs_prev_month_qty_pct = ((current_month_qty - prev_month_qty) / prev_month_qty * 100) if prev_month_qty > 0 else 0
                vs_prev_month_value_pct = ((current_month_value - prev_month_value) / prev_month_value * 100) if prev_month_value > 0 else 0
                vs_same_month_last_year_qty_pct = ((current_month_qty - same_month_last_year_qty) / same_month_last_year_qty * 100) if same_month_last_year_qty > 0 else 0
                vs_same_month_last_year_value_pct = ((current_month_value - same_month_last_year_value) / same_month_last_year_value * 100) if same_month_last_year_value > 0 else 0
                
                # Generate alerts (data only, no text)
                alerts = []
                avg_days = float(current_month_data['avg_days_delayed']) if current_month_data['avg_days_delayed'] else 0
                
                if vs_prev_month_qty_pct > 15:
                    alerts.append({
                        "type": "warning",
                        "metric": "backorder_increase_vs_prev_month",
                        "value": vs_prev_month_qty_pct
                    })
                elif vs_prev_month_qty_pct < -15:
                    alerts.append({
                        "type": "success",
                        "metric": "backorder_decrease_vs_prev_month",
                        "value": abs(vs_prev_month_qty_pct)
                    })
                
                if avg_days > 14:
                    alerts.append({
                        "type": "critical",
                        "metric": "high_avg_delay",
                        "value": avg_days
                    })
                
                if current_month_data['unique_products'] and int(current_month_data['unique_products']) > 50:
                    alerts.append({
                        "type": "warning",
                        "metric": "high_product_variety",
                        "value": int(current_month_data['unique_products'])
                    })
                
                if vs_same_month_last_year_qty_pct > 20 and same_month_last_year_qty > 0:
                    alerts.append({
                        "type": "warning",
                        "metric": "backorder_increase_vs_last_year",
                        "value": vs_same_month_last_year_qty_pct
                    })
                
                # Build result
                result = {
                    "year": target_year,
                    "month": target_month,
                    "period": f"{target_year}-{target_month:02d}",
                    "has_data": True,
                    "summary": {
                        "total_quantity": current_month_qty,
                        "total_value": current_month_value,
                        "unique_products": int(current_month_data['unique_products']) if current_month_data['unique_products'] else 0,
                        "unique_clients": int(current_month_data['unique_clients']) if current_month_data['unique_clients'] else 0,
                        "order_count": int(current_month_data['order_count']) if current_month_data['order_count'] else 0,
                        "avg_days_delayed": avg_days
                    },
                    "comparisons": {
                        "vs_prev_month": {
                            "quantity": prev_month_qty,
                            "value": prev_month_value,
                            "qty_change_pct": vs_prev_month_qty_pct,
                            "value_change_pct": vs_prev_month_value_pct,
                            "trend": "up" if vs_prev_month_qty_pct > 0 else "down" if vs_prev_month_qty_pct < 0 else "flat"
                        },
                        "vs_same_month_last_year": {
                            "quantity": same_month_last_year_qty,
                            "value": same_month_last_year_value,
                            "qty_change_pct": vs_same_month_last_year_qty_pct,
                            "value_change_pct": vs_same_month_last_year_value_pct,
                            "trend": "up" if vs_same_month_last_year_qty_pct > 0 else "down" if vs_same_month_last_year_qty_pct < 0 else "flat"
                        } if same_month_last_year_qty > 0 else None
                    },
                    "top_products": [
                        {
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "quantity": float(row['quantity']) if row['quantity'] else 0.0,
                            "value": float(row['value']) if row['value'] else 0.0,
                            "avg_days_delayed": float(row['avg_days_delayed']) if row['avg_days_delayed'] else 0.0,
                            "pct_of_total": (float(row['quantity']) / current_month_qty * 100) if current_month_qty > 0 and row['quantity'] else 0
                        }
                        for row in top_products
                    ],
                    "top_clients": [
                        {
                            "client_name": row['client_name'],
                            "client_group": row['client_group'],
                            "quantity": float(row['quantity']) if row['quantity'] else 0.0,
                            "value": float(row['value']) if row['value'] else 0.0,
                            "orders": int(row['orders']) if row['orders'] else 0,
                            "pct_of_total": (float(row['value']) / current_month_value * 100) if current_month_value > 0 and row['value'] else 0
                        }
                        for row in top_clients
                    ],
                    "aging_analysis": [
                        {
                            "age_bucket": row['age_bucket'],
                            "order_count": int(row['order_count']) if row['order_count'] else 0,
                            "quantity": float(row['quantity']) if row['quantity'] else 0.0,
                            "value": float(row['value']) if row['value'] else 0.0,
                            "pct_of_total": (float(row['value']) / current_month_value * 100) if current_month_value > 0 and row['value'] else 0
                        }
                        for row in aging_data
                    ],
                    "alerts": alerts
                }
                
                result_json = json.dumps(result)
                print(f"\n[BACKORDER HEALTH] ✅ Success - returning {len(result_json)} chars")
                print(f"  Period: {result['period']}, Has data: {result['has_data']}")
                print(f"  Total value: ${result['summary']['total_value']:,.2f}\n")
                return result_json
        except Exception as e:
            print(f"\n[BACKORDER HEALTH] ❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await pool.close()
    
    return get_backorder_health

