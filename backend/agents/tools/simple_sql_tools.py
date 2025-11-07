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
        Get INDIVIDUAL backorder records (limited to top_n records).
        
        **USE THIS TOOL WHEN:**
        - User asks "Lista de backorders" (wants list)
        - "Muéstrame los backorders" (wants details)
        - "Detalle de backorders" (wants individual records)
        - "Cuáles son los backorders" (wants specific items)
        
        **DO NOT USE for:**
        - "Dame el backorder" → use get_backorders_summary instead
        - "Total de backorders" → use get_backorders_summary instead
        - "¿Cuánto backorder?" → use get_backorders_summary instead
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-06-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-06-30")
            product_id: Specific product ID to filter (optional)
            top_n: Number of results to return (default 20)
        
        Returns:
            Text with list of backorder records (product, qty, value, location)
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
                
                total_qty = sum(row['backorder_qty'] for row in rows)
                total_value = sum(float(row['backorder_value']) for row in rows)
                
                response = f"Found {len(rows)} backorder(s), Total Qty: {total_qty}, Total Value: ${total_value:,.2f}\n\n"
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
        product_id: Optional[str] = None
    ) -> str:
        """
        Get TOTAL AGGREGATED backorder metrics (SUM of all records, no limits).
        
        **USE THIS TOOL WHEN:**
        - User asks "Dame el backorder" (wants total)
        - "¿Cuánto backorder hay?" (wants quantity/value)
        - "Total de backorders de junio" (wants aggregate)
        - "Resumen de backorders" (wants summary)
        
        **DO NOT USE for:**
        - "Lista de backorders" → use query_backorders instead
        - "Muéstrame los backorders" → use query_backorders instead
        
        Args:
            start_date: Start date in YYYY-MM-DD format (e.g., "2025-06-01")
            end_date: End date in YYYY-MM-DD format (e.g., "2025-06-30")
            product_id: Specific product ID to filter (optional)
        
        Returns:
            JSON with total_quantity, total_value, record_count, top_products
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
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # Get totals
        sql_totals = f"""
            SELECT 
                COUNT(*) as record_count,
                SUM(b.backorder_qty) as total_quantity,
                SUM(b.backorder_qty * b.unit_price) as total_value,
                SUM(b.order_qty) as total_ordered,
                SUM(b.delivery_qty) as total_delivered
            FROM backorder b
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
                
                result = {
                    "record_count": int(totals['record_count']) if totals['record_count'] is not None else 0,
                    "total_quantity": int(totals['total_quantity']) if totals['total_quantity'] is not None else 0,
                    "total_value": float(totals['total_value']) if totals['total_value'] is not None else 0.0,
                    "total_ordered": int(totals['total_ordered']) if totals['total_ordered'] is not None else 0,
                    "total_delivered": int(totals['total_delivered']) if totals['total_delivered'] is not None else 0,
                    "top_products": [
                        {
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "quantity": int(row['total_qty']) if row['total_qty'] is not None else 0,
                            "value": float(row['total_value']) if row['total_value'] is not None else 0.0
                        }
                        for row in top_products
                    ]
                }
                
                return json.dumps(result)
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
        client_id: Optional[str] = None
    ) -> str:
        """
        Get TOTAL AGGREGATED sales metrics (SUM of all records, no limits).
        
        **USE THIS TOOL WHEN:**
        - User asks "Total de ventas" (wants total)
        - "¿Cuánto vendimos?" (wants aggregate)
        - "Dame las ventas de junio" (wants sum)
        - "Resumen de ventas" (wants summary)
        
        **DO NOT USE for:**
        - "Lista de ventas" → use query_sales instead
        - "Muéstrame transacciones" → use query_sales instead
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            product_id: Specific product ID to filter (optional)
            client_id: Specific client ID to filter (optional)
        
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
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
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

