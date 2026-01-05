"""
Advanced SQL analysis tools for complex queries
These tools provide business intelligence and analytical capabilities
"""
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


# ============================================================================
# CLIENT ANALYSIS TOOLS
# ============================================================================

def create_client_sales_analysis_tool(queries_executed: List[Dict]):
    """Tool to analyze sales by client"""
    
    @tool
    async def get_client_sales_analysis(
        client_id: Optional[str] = None,
        client_group: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        top_n: int = 10
    ) -> str:
        """
        Analyze sales performance by client with detailed metrics.
        
        Args:
            client_id: Specific client ID to filter (optional)
            client_group: Client group to filter (optional)
            start_date: Start date in YYYY-MM-DD format (default: 30 days ago)
            end_date: End date in YYYY-MM-DD format (default: today)
            top_n: Number of top clients to return (default 10)
        
        Returns:
            JSON with client sales metrics including total, avg, and top products
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
        
        if client_id:
            conditions.append(f"c.client_id = ${param_counter}")
            params.append(client_id)
            param_counter += 1
        
        if client_group:
            conditions.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        sql = f"""
            SELECT 
                c.client_id,
                c.client_name,
                c.client_group,
                c.city,
                COUNT(*) as transaction_count,
                SUM(t.gross_amount) as total_gross,
                SUM(t.net_amount) as total_net,
                SUM(t.discount_amount) as total_discounts,
                AVG(t.net_amount) as avg_transaction_value,
                SUM(t.quantity) as total_quantity
            FROM transactions t
            JOIN clients c ON t.client_id = c.client_id
            {where_clause}
            GROUP BY c.client_id, c.client_name, c.client_group, c.city
            ORDER BY total_net DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"message": "No sales data found for specified criteria"})
                
                result = {
                    "clients": [
                        {
                            "client_id": row['client_id'],
                            "client_name": row['client_name'],
                            "client_group": row['client_group'],
                            "city": row['city'],
                            "transaction_count": row['transaction_count'],
                            "total_gross": float(row['total_gross']),
                            "total_net": float(row['total_net']),
                            "total_discounts": float(row['total_discounts']),
                            "avg_transaction_value": float(row['avg_transaction_value']),
                            "total_quantity": row['total_quantity']
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_client_sales_analysis


def create_budget_vs_actual_tool(queries_executed: List[Dict]):
    """Tool to compare budgets vs actual sales"""
    
    @tool
    async def get_budget_vs_actual(
        customer_id: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> str:
        """
        Compare budget vs actual sales by customer.
        
        Args:
            customer_id: Specific customer ID to filter (optional)
            year: Year to filter (e.g., 2025) (optional)
            month: Month to filter (1-12) (optional)
        
        Returns:
            JSON with budget, actual sales, variance, and achievement percentage
        """
        conditions = ["t.transaction_type = 'SALE'"]
        params = []
        param_counter = 1
        
        if customer_id:
            conditions.append(f"b.client_id = ${param_counter}")
            params.append(customer_id)
            param_counter += 1
        
        if year and month:
            date_filter = f"b.date = DATE '{year}-{month:02d}-01'"
            conditions.append(date_filter)
        elif year:
            conditions.append(f"EXTRACT(YEAR FROM b.date) = {year}")
        
        where_clause = f"WHERE {' AND '.join(conditions[1:])}" if len(conditions) > 1 else ""
        
        # Updated query to use budgets table with client_name directly
        sql = f"""
            SELECT 
                b.date,
                b.client_id,
                b.client_name,
                c.client_group,
                b.budget,
                COALESCE(SUM(t.net_amount), 0) as actual_sales,
                b.budget - COALESCE(SUM(t.net_amount), 0) as variance,
                CASE 
                    WHEN b.budget > 0 THEN (COALESCE(SUM(t.net_amount), 0) / b.budget * 100)
                    ELSE 0 
                END as achievement_pct
            FROM budgets b
            LEFT JOIN clients c ON b.client_id = c.client_id
            LEFT JOIN transactions t ON t.client_id = b.client_id 
                AND DATE_TRUNC('month', t.date) = b.date
                AND t.transaction_type = 'SALE'
            {where_clause}
            GROUP BY b.date, b.client_id, b.client_name, c.client_group, b.budget
            ORDER BY b.date DESC
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"message": "No budget data found"})
                
                result = {
                    "records": [
                        {
                            "month": row['date'].strftime('%Y-%m'),
                            "client_id": row['client_id'],
                            "client_name": row['client_name'],
                            "client_group": row['client_group'],
                            "budget": float(row['budget']),
                            "actual_sales": float(row['actual_sales']),
                            "variance": float(row['variance']),
                            "achievement_pct": float(row['achievement_pct']),
                            "status": "above_budget" if float(row['variance']) < 0 else "below_budget"
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_budget_vs_actual


# ============================================================================
# PRODUCT ANALYSIS TOOLS
# ============================================================================

def create_product_performance_tool(queries_executed: List[Dict]):
    """Tool to analyze product performance across sales, inventory, and backorders"""
    
    @tool
    async def get_product_performance(
        product_id: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        top_n: int = 20
    ) -> str:
        """
        Get comprehensive product performance metrics including sales, inventory, and backorders.
        
        Args:
            product_id: Specific product ID to filter (optional)
            category: Product category to filter (optional)
            start_date: Start date for sales analysis (default: 30 days ago)
            end_date: End date for sales analysis (default: today)
            top_n: Number of top products to return (default 20)
        
        Returns:
            JSON with product metrics including sales, inventory, and backorder status
        """
        conditions = []
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        date_conditions = ["t.transaction_type = 'SALE'"]
        
        if start_date_obj:
            date_conditions.append(f"t.date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            date_conditions.append("t.date >= CURRENT_DATE - INTERVAL '30 days'")
        
        if end_date_obj:
            date_conditions.append(f"t.date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if product_id:
            conditions.append(f"p.product_id = ${param_counter}")
            params.append(product_id)
            param_counter += 1
        
        if category:
            conditions.append(f"p.category = ${param_counter}")
            params.append(category)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        date_where = f"WHERE {' AND '.join(date_conditions + conditions)}"
        
        sql = f"""
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                p.category,
                p.subcategory,
                COALESCE(SUM(t.quantity), 0) as sales_qty,
                COALESCE(SUM(t.net_amount), 0) as sales_value,
                COALESCE(AVG(t.unit_price), 0) as avg_unit_price,
                (SELECT SUM(inventory_qty) FROM inventory WHERE product_id = p.product_id) as current_inventory,
                (SELECT SUM(backorder_qty) FROM backorder WHERE product_id = p.product_id) as backorder_qty,
                CASE 
                    WHEN (SELECT SUM(inventory_qty) FROM inventory WHERE product_id = p.product_id) > 100 THEN 'high'
                    WHEN (SELECT SUM(inventory_qty) FROM inventory WHERE product_id = p.product_id) > 20 THEN 'medium'
                    ELSE 'low'
                END as stock_status
            FROM products p
            LEFT JOIN transactions t ON p.product_id = t.product_id 
                AND t.transaction_type = 'SALE'
                {f"AND t.date >= ${params.index(start_date_obj) + 1 if start_date_obj in params else 'CURRENT_DATE - INTERVAL \'30 days\''}" if start_date_obj or not start_date else ""}
                {f"AND t.date <= ${params.index(end_date_obj) + 1 if end_date_obj in params else ''}" if end_date_obj else ""}
            {where_clause}
            GROUP BY p.product_id, p.product_name, p.brand, p.category, p.subcategory
            ORDER BY sales_value DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"message": "No product data found"})
                
                result = {
                    "products": [
                        {
                            "product_id": row['product_id'],
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "category": row['category'],
                            "subcategory": row['subcategory'],
                            "sales_qty": row['sales_qty'],
                            "sales_value": float(row['sales_value']),
                            "avg_unit_price": float(row['avg_unit_price']),
                            "current_inventory": row['current_inventory'] or 0,
                            "backorder_qty": row['backorder_qty'] or 0,
                            "stock_status": row['stock_status']
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_product_performance


def create_slow_moving_products_tool(queries_executed: List[Dict]):
    """Tool to identify slow-moving inventory"""
    
    @tool
    async def get_slow_moving_products(
        days_threshold: int = 90,
        inventory_min: int = 100
    ) -> str:
        """
        Identify products with high inventory but low/no recent sales.
        
        Args:
            days_threshold: Days without sales to consider slow-moving (default 90)
            inventory_min: Minimum inventory quantity to include (default 100)
        
        Returns:
            JSON with slow-moving products and their inventory levels
        """
        sql = f"""
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                p.category,
                SUM(i.inventory_qty) as inventory_qty,
                MAX(t.date) as last_sale_date,
                COALESCE(CURRENT_DATE - MAX(t.date), 9999) as days_without_sale,
                l.location_name
            FROM products p
            JOIN inventory i ON p.product_id = i.product_id
            JOIN locations l ON i.location_id = l.location_id
            LEFT JOIN transactions t ON p.product_id = t.product_id 
                AND t.transaction_type = 'SALE'
            WHERE i.inventory_qty > {inventory_min}
            GROUP BY p.product_id, p.product_name, p.brand, p.category, l.location_name
            HAVING COALESCE(CURRENT_DATE - MAX(t.date), 9999) > {days_threshold}
            ORDER BY days_without_sale DESC, inventory_qty DESC
            LIMIT 50
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [],
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql)
                
                if not rows:
                    return json.dumps({"message": "No slow-moving products found"})
                
                result = {
                    "products": [
                        {
                            "product_id": row['product_id'],
                            "product_name": row['product_name'],
                            "brand": row['brand'],
                            "category": row['category'],
                            "inventory_qty": row['inventory_qty'],
                            "last_sale_date": row['last_sale_date'].strftime('%Y-%m-%d') if row['last_sale_date'] else 'Never',
                            "days_without_sale": row['days_without_sale'] if row['days_without_sale'] < 9999 else 'Never sold',
                            "location_name": row['location_name']
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_slow_moving_products


# ============================================================================
# LOCATION ANALYSIS TOOLS
# ============================================================================

def create_location_performance_tool(queries_executed: List[Dict]):
    """Tool to analyze location/warehouse performance"""
    
    @tool
    async def get_location_performance(
        location_id: Optional[str] = None,
        city: Optional[str] = None
    ) -> str:
        """
        Analyze performance of warehouses/locations.
        
        Args:
            location_id: Specific location ID to filter (optional)
            city: City to filter (optional)
        
        Returns:
            JSON with location metrics including inventory and backorders
        """
        conditions = []
        params = []
        param_counter = 1
        
        if location_id:
            conditions.append(f"l.location_id = ${param_counter}")
            params.append(location_id)
            param_counter += 1
        
        if city:
            conditions.append(f"l.city = ${param_counter}")
            params.append(city)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        sql = f"""
            SELECT 
                l.location_id,
                l.location_name,
                l.city,
                COALESCE(SUM(i.inventory_qty), 0) as total_inventory,
                COUNT(DISTINCT i.product_id) as unique_products,
                (SELECT COUNT(*) FROM backorder WHERE location_id = l.location_id) as backorders_count,
                (SELECT SUM(backorder_qty * unit_price) FROM backorder WHERE location_id = l.location_id) as backorder_value
            FROM locations l
            LEFT JOIN inventory i ON l.location_id = i.location_id
            {where_clause}
            GROUP BY l.location_id, l.location_name, l.city
            ORDER BY total_inventory DESC
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"message": "No location data found"})
                
                result = {
                    "locations": [
                        {
                            "location_id": row['location_id'],
                            "location_name": row['location_name'],
                            "city": row['city'],
                            "total_inventory": row['total_inventory'],
                            "unique_products": row['unique_products'],
                            "backorders_count": row['backorders_count'],
                            "backorder_value": float(row['backorder_value'] or 0)
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_location_performance


def create_inventory_distribution_tool(queries_executed: List[Dict]):
    """Tool to see distribution of a product across locations"""
    
    @tool
    async def get_inventory_distribution(product_id: str) -> str:
        """
        Show how a specific product is distributed across all locations.
        
        Args:
            product_id: Product ID (required)
        
        Returns:
            JSON with inventory distribution by location
        """
        sql = """
            WITH total_inventory AS (
                SELECT SUM(inventory_qty) as total 
                FROM inventory 
                WHERE product_id = $1
            )
            SELECT 
                p.product_name,
                l.location_name,
                l.city,
                i.inventory_qty,
                CASE 
                    WHEN ti.total > 0 THEN (i.inventory_qty::float / ti.total * 100)
                    ELSE 0
                END as pct_of_total
            FROM inventory i
            JOIN locations l ON i.location_id = l.location_id
            JOIN products p ON i.product_id = p.product_id
            CROSS JOIN total_inventory ti
            WHERE i.product_id = $1
            ORDER BY i.inventory_qty DESC
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [product_id],
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, product_id)
                
                if not rows:
                    return json.dumps({"message": f"No inventory found for product {product_id}"})
                
                product_name = rows[0]['product_name']
                total_qty = sum(row['inventory_qty'] for row in rows)
                
                result = {
                    "product_id": product_id,
                    "product_name": product_name,
                    "total_inventory": total_qty,
                    "distribution": [
                        {
                            "location_name": row['location_name'],
                            "city": row['city'],
                            "inventory_qty": row['inventory_qty'],
                            "pct_of_total": float(row['pct_of_total'])
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_inventory_distribution


# ============================================================================
# SELLER ANALYSIS TOOLS
# ============================================================================

def create_seller_performance_tool(queries_executed: List[Dict]):
    """Tool to analyze seller performance"""
    
    @tool
    async def get_seller_performance(
        seller_name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> str:
        """
        Analyze sales performance by seller.
        
        Args:
            seller_name: Specific seller name to filter (optional)
            start_date: Start date in YYYY-MM-DD format (default: 30 days ago)
            end_date: End date in YYYY-MM-DD format (default: today)
        
        Returns:
            JSON with seller performance metrics
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
        
        if seller_name:
            conditions.append(f"t.seller_name = ${param_counter}")
            params.append(seller_name)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
        sql = f"""
            SELECT 
                t.seller_name,
                COUNT(*) as transaction_count,
                SUM(t.net_amount) as total_sales,
                COUNT(DISTINCT t.client_id) as unique_clients,
                AVG(t.net_amount) as avg_transaction_value,
                SUM(t.quantity) as total_units_sold,
                (SELECT COUNT(*) FROM backorder WHERE seller_name = t.seller_name) as backorders_managed
            FROM transactions t
            {where_clause}
            GROUP BY t.seller_name
            ORDER BY total_sales DESC
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"message": "No seller data found"})
                
                result = {
                    "sellers": [
                        {
                            "seller_name": row['seller_name'],
                            "transaction_count": row['transaction_count'],
                            "total_sales": float(row['total_sales']),
                            "unique_clients": row['unique_clients'],
                            "avg_transaction_value": float(row['avg_transaction_value']),
                            "total_units_sold": row['total_units_sold'],
                            "backorders_managed": row['backorders_managed']
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_seller_performance


# ============================================================================
# TEMPORAL ANALYSIS TOOLS
# ============================================================================

def create_monthly_trend_tool(queries_executed: List[Dict]):
    """Tool to analyze monthly trends"""
    
    @tool
    async def get_monthly_trend(
        metric_type: str = 'sales',
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> str:
        """
        Analyze monthly trends for sales or backorders.
        
        Args:
            metric_type: Type of metric - 'sales' or 'backorders' (default: 'sales')
            start_date: Start date in YYYY-MM-DD format (default: 6 months ago)
            end_date: End date in YYYY-MM-DD format (default: today)
        
        Returns:
            JSON with monthly trend data
        """
        conditions = []
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if metric_type == 'sales':
            conditions.append("t.transaction_type = 'SALE'")
            
            if start_date_obj:
                conditions.append(f"t.date >= ${param_counter}")
                params.append(start_date_obj)
                param_counter += 1
            else:
                conditions.append("t.date >= CURRENT_DATE - INTERVAL '6 months'")
            
            if end_date_obj:
                conditions.append(f"t.date <= ${param_counter}")
                params.append(end_date_obj)
                param_counter += 1
            
            where_clause = f"WHERE {' AND '.join(conditions)}"
            
            sql = f"""
                SELECT 
                    DATE_TRUNC('month', t.date) as month,
                    SUM(t.net_amount) as total_value,
                    COUNT(*) as transaction_count,
                    AVG(t.net_amount) as avg_transaction_value,
                    SUM(t.quantity) as total_quantity
                FROM transactions t
                {where_clause}
                GROUP BY DATE_TRUNC('month', t.date)
                ORDER BY month
            """
        else:  # backorders
            if start_date_obj:
                conditions.append(f"b.date >= ${param_counter}")
                params.append(start_date_obj)
                param_counter += 1
            else:
                conditions.append("b.date >= CURRENT_DATE - INTERVAL '6 months'")
            
            if end_date_obj:
                conditions.append(f"b.date <= ${param_counter}")
                params.append(end_date_obj)
                param_counter += 1
            
            where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
            
            sql = f"""
                SELECT 
                    DATE_TRUNC('month', b.date) as month,
                    SUM(b.backorder_qty * b.unit_price) as total_value,
                    COUNT(*) as record_count,
                    SUM(b.backorder_qty) as total_quantity
                FROM backorder b
                {where_clause}
                GROUP BY DATE_TRUNC('month', b.date)
                ORDER BY month
            """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({"message": f"No {metric_type} trend data found"})
                
                result = {
                    "metric_type": metric_type,
                    "months": [
                        {
                            "month": row['month'].strftime('%Y-%m'),
                            "total_value": float(row['total_value']),
                            "count": row.get('transaction_count') or row.get('record_count'),
                            "total_quantity": row['total_quantity'],
                            "avg_value": float(row['avg_transaction_value']) if 'avg_transaction_value' in row.keys() else float(row['total_value']) / (row.get('transaction_count') or row.get('record_count'))
                        }
                        for row in rows
                    ]
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_monthly_trend


def create_order_fulfillment_rate_tool(queries_executed: List[Dict]):
    """Tool to analyze order fulfillment rate"""
    
    @tool
    async def get_order_fulfillment_rate(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        location_id: Optional[str] = None
    ) -> str:
        """
        Calculate order fulfillment rate (delivered vs ordered).
        
        Args:
            start_date: Start date in YYYY-MM-DD format (default: 90 days ago)
            end_date: End date in YYYY-MM-DD format (default: today)
            location_id: Specific location ID to filter (optional)
        
        Returns:
            JSON with fulfillment metrics
        """
        conditions = []
        params = []
        param_counter = 1
        
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if start_date_obj:
            conditions.append(f"date >= ${param_counter}")
            params.append(start_date_obj)
            param_counter += 1
        else:
            conditions.append("date >= CURRENT_DATE - INTERVAL '90 days'")
        
        if end_date_obj:
            conditions.append(f"date <= ${param_counter}")
            params.append(end_date_obj)
            param_counter += 1
        
        if location_id:
            conditions.append(f"location_id = ${param_counter}")
            params.append(location_id)
            param_counter += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(order_qty) as total_ordered,
                SUM(delivery_qty) as total_delivered,
                SUM(backorder_qty) as total_backorder,
                CASE 
                    WHEN SUM(order_qty) > 0 THEN (SUM(delivery_qty)::float / SUM(order_qty) * 100)
                    ELSE 0
                END as fulfillment_rate,
                AVG(days_delayed) as avg_days_delayed
            FROM backorder
            {where_clause}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "advanced_agent_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(sql, *params)
                
                if not row or row['total_orders'] == 0:
                    return json.dumps({"message": "No order data found"})
                
                result = {
                    "total_orders": row['total_orders'],
                    "total_ordered_qty": row['total_ordered'],
                    "total_delivered_qty": row['total_delivered'],
                    "total_backorder_qty": row['total_backorder'],
                    "fulfillment_rate": float(row['fulfillment_rate']),
                    "avg_days_delayed": float(row['avg_days_delayed'])
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_order_fulfillment_rate

