"""
Growth and trend analysis tools for sales and products
These tools provide time-based comparisons and growth metrics
"""
from langchain_core.tools import tool
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
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


def create_product_first_sale_tool(queries_executed: List[Dict]):
    """Tool to find when a product was first sold"""
    
    @tool
    async def get_product_first_sale(product_id: str) -> str:
        """
        Find when a product was first sold (launch date).
        
        **USE THIS TOOL WHEN:**
        - "¿Cuándo arrancó la venta de producto X?"
        - "¿Cuándo se lanzó el producto?"
        - "Primera venta de producto X"
        - "Fecha de lanzamiento de producto"
        
        Args:
            product_id: Product ID (required) - use search_products first to get ID
        
        Returns:
            JSON with first sale date, client, seller, quantity, days since launch
        """
        sql = """
            SELECT 
                p.product_id,
                p.product_name,
                p.brand,
                MIN(t.date) as first_sale_date,
                EXTRACT(DAY FROM (CURRENT_DATE - MIN(t.date))) as days_since_launch
            FROM transactions t
            JOIN products p ON t.product_id = p.product_id
            WHERE t.transaction_type = 'SALE' AND p.product_id = $1
            GROUP BY p.product_id, p.product_name, p.brand
        """
        
        # Get first sale details
        sql_details = """
            SELECT 
                t.date,
                t.quantity,
                t.net_amount,
                c.client_name,
                c.client_group,
                t.seller_name
            FROM transactions t
            JOIN products p ON t.product_id = p.product_id
            JOIN clients c ON t.client_id = c.client_id
            WHERE t.transaction_type = 'SALE' 
                AND p.product_id = $1
            ORDER BY t.date ASC
            LIMIT 1
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [product_id],
            "source": "growth_analysis_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                summary = await conn.fetchrow(sql, product_id)
                details = await conn.fetchrow(sql_details, product_id)
                
                if not summary or not summary['first_sale_date']:
                    return json.dumps({
                        "error": f"No sales found for product {product_id}",
                        "product_id": product_id
                    })
                
                result = {
                    "product_id": summary['product_id'],
                    "product_name": summary['product_name'],
                    "brand": summary['brand'],
                    "first_sale_date": summary['first_sale_date'].strftime('%Y-%m-%d'),
                    "days_since_launch": int(summary['days_since_launch']),
                    "first_sale_details": {
                        "quantity": float(details['quantity']),
                        "amount": float(details['net_amount']),
                        "client_name": details['client_name'],
                        "client_group": details['client_group'],
                        "seller_name": details['seller_name']
                    }
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
        - "Clientes sin venta en los últimos X días/meses"
        - "Clientes inactivos"
        - "Clientes con más de X meses sin venta"
        - "Detalle los clientes con más de 3 meses sin venta y quién es su vendedor"
        
        Args:
            days_threshold: Days without sales to consider inactive (default 90 = ~3 months)
            top_n: Number of results to return (default 50)
        
        Returns:
            JSON with inactive clients, last sale date, days inactive, last seller, lifetime sales
        """
        sql = f"""
            WITH last_sales AS (
                SELECT 
                    c.client_id,
                    c.client_name,
                    c.client_group,
                    c.city,
                    MAX(t.date) as last_sale_date,
                    EXTRACT(DAY FROM (CURRENT_DATE - MAX(t.date))) as days_since_last_sale,
                    SUM(t.net_amount) as lifetime_sales,
                    COUNT(*) as total_transactions
                FROM clients c
                LEFT JOIN transactions t ON c.client_id = t.client_id 
                    AND t.transaction_type = 'SALE'
                GROUP BY c.client_id, c.client_name, c.client_group, c.city
                HAVING MAX(t.date) IS NULL 
                    OR EXTRACT(DAY FROM (CURRENT_DATE - MAX(t.date))) >= {days_threshold}
            ),
            last_seller AS (
                SELECT DISTINCT ON (t.client_id)
                    t.client_id,
                    t.seller_name
                FROM transactions t
                WHERE t.transaction_type = 'SALE'
                ORDER BY t.client_id, t.date DESC
            )
            SELECT 
                ls.client_id,
                ls.client_name,
                ls.client_group,
                ls.city,
                ls.last_sale_date,
                ls.days_since_last_sale,
                ls.lifetime_sales,
                ls.total_transactions,
                lv.seller_name as last_seller_name
            FROM last_sales ls
            LEFT JOIN last_seller lv ON ls.client_id = lv.client_id
            ORDER BY ls.days_since_last_sale DESC, ls.lifetime_sales DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [],
            "source": "growth_analysis_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql)
                
                if not rows:
                    return json.dumps({
                        "message": f"No inactive clients found (threshold: {days_threshold} days)",
                        "clients": []
                    })
                
                clients_data = []
                for row in rows:
                    clients_data.append({
                        "client_id": row['client_id'],
                        "client_name": row['client_name'],
                        "client_group": row['client_group'] if row['client_group'] else 'N/A',
                        "city": row['city'] if row['city'] else 'N/A',
                        "last_sale_date": row['last_sale_date'].strftime('%Y-%m-%d') if row['last_sale_date'] else 'Never',
                        "days_since_last_sale": int(row['days_since_last_sale']) if row['days_since_last_sale'] is not None else 9999,
                        "lifetime_sales": float(row['lifetime_sales']) if row['lifetime_sales'] else 0.0,
                        "total_transactions": int(row['total_transactions']) if row['total_transactions'] else 0,
                        "last_seller_name": row['last_seller_name'] if row['last_seller_name'] else 'Unknown'
                    })
                
                result = {
                    "days_threshold": days_threshold,
                    "total_inactive_clients": len(clients_data),
                    "clients": clients_data
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_inactive_clients


def create_product_growth_analysis_tool(queries_executed: List[Dict]):
    """Tool to analyze product sales growth/decline trends"""
    
    @tool
    async def get_product_growth_analysis(
        period_type: str = "month",
        periods_back: int = 12,
        product_id: Optional[str] = None,
        category: Optional[str] = None,
        top_n: int = 20
    ) -> str:
        """
        Analyze sales growth/decline trends over time for products.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué productos están creciendo/decreciendo?"
        - "Productos que vienen decreciendo en los últimos X años/meses"
        - "Tendencia de ventas de producto X"
        - "Productos con crecimiento vs año/mes/trimestre pasado"
        
        Args:
            period_type: Time period - "month", "quarter", "year" (default: "month")
            periods_back: How many periods to analyze (default: 12)
            product_id: Specific product to analyze (optional)
            category: Filter by category (optional)
            top_n: Number of products to return (default: 20)
        
        Returns:
            JSON with products, their sales by period, growth rate, and trend (growing/declining/stable)
        """
        # Determine date truncation based on period type
        if period_type == "quarter":
            date_trunc = "quarter"
        elif period_type == "year":
            date_trunc = "year"
        else:  # month
            date_trunc = "month"
        
        # Calculate lookback date
        if period_type == "year":
            interval = f"{periods_back} years"
        elif period_type == "quarter":
            interval = f"{periods_back * 3} months"
        else:
            interval = f"{periods_back} months"
        
        conditions = ["t.transaction_type = 'SALE'", f"t.date >= CURRENT_DATE - INTERVAL '{interval}'"]
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
        
        sql = f"""
            WITH period_sales AS (
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.brand,
                    p.category,
                    DATE_TRUNC('{date_trunc}', t.date) as period,
                    SUM(t.net_amount) as period_sales,
                    SUM(t.quantity) as period_quantity
                FROM transactions t
                JOIN products p ON t.product_id = p.product_id
                {where_clause}
                GROUP BY p.product_id, p.product_name, p.brand, p.category, DATE_TRUNC('{date_trunc}', t.date)
            ),
            product_stats AS (
                SELECT 
                    product_id,
                    product_name,
                    brand,
                    category,
                    COUNT(*) as periods_with_sales,
                    SUM(period_sales) as total_sales,
                    AVG(period_sales) as avg_period_sales,
                    MAX(period_sales) as max_period_sales,
                    MIN(period_sales) as min_period_sales,
                    -- Calculate simple growth rate (last period vs first period)
                    (MAX(CASE WHEN period = (SELECT MAX(period) FROM period_sales ps2 WHERE ps2.product_id = period_sales.product_id) THEN period_sales END) - 
                     MIN(CASE WHEN period = (SELECT MIN(period) FROM period_sales ps2 WHERE ps2.product_id = period_sales.product_id) THEN period_sales END)) /
                    NULLIF(MIN(CASE WHEN period = (SELECT MIN(period) FROM period_sales ps2 WHERE ps2.product_id = period_sales.product_id) THEN period_sales END), 0) * 100 as growth_rate_pct
                FROM period_sales
                GROUP BY product_id, product_name, brand, category
                HAVING COUNT(*) >= 2
            )
            SELECT 
                product_id,
                product_name,
                brand,
                category,
                periods_with_sales,
                total_sales,
                avg_period_sales,
                growth_rate_pct,
                CASE 
                    WHEN growth_rate_pct > 10 THEN 'growing'
                    WHEN growth_rate_pct < -10 THEN 'declining'
                    ELSE 'stable'
                END as trend,
                CASE 
                    WHEN growth_rate_pct < -30 THEN 'discontinue'
                    WHEN growth_rate_pct < -10 THEN 'watch'
                    ELSE 'keep'
                END as recommendation
            FROM product_stats
            ORDER BY total_sales DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "growth_analysis_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
                
                if not rows:
                    return json.dumps({
                        "message": "No product data found for analysis",
                        "products": []
                    })
                
                products_data = []
                for row in rows:
                    products_data.append({
                        "product_id": row['product_id'],
                        "product_name": row['product_name'],
                        "brand": row['brand'],
                        "category": row['category'],
                        "periods_with_sales": int(row['periods_with_sales']),
                        "total_sales": float(row['total_sales']),
                        "avg_period_sales": float(row['avg_period_sales']),
                        "growth_rate_pct": float(row['growth_rate_pct']) if row['growth_rate_pct'] is not None else 0.0,
                        "trend": row['trend'],
                        "recommendation": row['recommendation']
                    })
                
                result = {
                    "period_type": period_type,
                    "periods_analyzed": periods_back,
                    "total_products": len(products_data),
                    "products": products_data
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_product_growth_analysis


def create_sales_comparison_tool(queries_executed: List[Dict]):
    """Tool to compare sales between periods (e.g., vs previous year)"""
    
    @tool
    async def get_sales_comparison(
        start_date: str,
        end_date: str,
        compare_previous_year: bool = True,
        client_group: Optional[str] = None
    ) -> str:
        """
        Compare sales between two periods (current vs previous year/period).
        
        **USE THIS TOOL WHEN:**
        - "Crecimiento en ventas vs año pasado"
        - "Comparar ventas de este año con el año anterior"
        - "¿Cómo van las ventas vs el año pasado?"
        - "Ventas de X vs mismo período año anterior"
        
        Args:
            start_date: Start date for current period (YYYY-MM-DD)
            end_date: End date for current period (YYYY-MM-DD)
            compare_previous_year: If True, compare with same period last year (default: True)
            client_group: Filter by client group (optional)
        
        Returns:
            JSON with current sales, previous period sales, variance, and growth percentage
        """
        start_date_obj = parse_date(start_date)
        end_date_obj = parse_date(end_date)
        
        if not start_date_obj or not end_date_obj:
            return json.dumps({"error": "Invalid date format. Use YYYY-MM-DD"})
        
        # Calculate previous period dates (1 year back by default)
        if compare_previous_year:
            prev_start = start_date_obj.replace(year=start_date_obj.year - 1)
            prev_end = end_date_obj.replace(year=end_date_obj.year - 1)
        else:
            days_diff = (end_date_obj - start_date_obj).days
            prev_end = start_date_obj - timedelta(days=1)
            prev_start = prev_end - timedelta(days=days_diff)
        
        conditions_current = [
            "t.transaction_type = 'SALE'",
            f"t.date >= $1",
            f"t.date <= $2"
        ]
        
        conditions_prev = [
            "t.transaction_type = 'SALE'",
            f"t.date >= $3",
            f"t.date <= $4"
        ]
        
        params = [start_date_obj, end_date_obj, prev_start, prev_end]
        param_counter = 5
        
        if client_group:
            conditions_current.append(f"c.client_group = ${param_counter}")
            conditions_prev.append(f"c.client_group = ${param_counter}")
            params.append(client_group)
        
        client_join = "JOIN clients c ON t.client_id = c.client_id" if client_group else ""
        
        sql = f"""
            WITH current_period AS (
                SELECT 
                    SUM(t.net_amount) as sales,
                    SUM(t.quantity) as quantity,
                    COUNT(*) as transactions
                FROM transactions t
                {client_join}
                WHERE {' AND '.join(conditions_current)}
            ),
            previous_period AS (
                SELECT 
                    SUM(t.net_amount) as sales,
                    SUM(t.quantity) as quantity,
                    COUNT(*) as transactions
                FROM transactions t
                {client_join}
                WHERE {' AND '.join(conditions_prev)}
            )
            SELECT 
                c.sales as current_sales,
                c.quantity as current_quantity,
                c.transactions as current_transactions,
                p.sales as previous_sales,
                p.quantity as previous_quantity,
                p.transactions as previous_transactions,
                (c.sales - p.sales) as variance,
                CASE 
                    WHEN p.sales > 0 THEN ((c.sales - p.sales) / p.sales * 100)
                    ELSE 0
                END as growth_pct
            FROM current_period c, previous_period p
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": params,
            "source": "growth_analysis_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(sql, *params)
                
                if not row:
                    return json.dumps({"error": "No data found for comparison"})
                
                result = {
                    "current_period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "sales": float(row['current_sales']) if row['current_sales'] else 0.0,
                        "quantity": float(row['current_quantity']) if row['current_quantity'] else 0.0,
                        "transactions": int(row['current_transactions']) if row['current_transactions'] else 0
                    },
                    "previous_period": {
                        "start_date": prev_start.strftime('%Y-%m-%d'),
                        "end_date": prev_end.strftime('%Y-%m-%d'),
                        "sales": float(row['previous_sales']) if row['previous_sales'] else 0.0,
                        "quantity": float(row['previous_quantity']) if row['previous_quantity'] else 0.0,
                        "transactions": int(row['previous_transactions']) if row['previous_transactions'] else 0
                    },
                    "comparison": {
                        "variance": float(row['variance']) if row['variance'] else 0.0,
                        "growth_pct": float(row['growth_pct']) if row['growth_pct'] is not None else 0.0,
                        "status": "growth" if (row['growth_pct'] or 0) > 0 else "decline" if (row['growth_pct'] or 0) < 0 else "stable"
                    }
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_sales_comparison


def create_discontinuation_candidates_tool(queries_executed: List[Dict]):
    """Tool to identify products that could be discontinued"""
    
    @tool
    async def get_discontinuation_candidates(
        sales_threshold: float = 1000.0,
        months_lookback: int = 6,
        inventory_threshold: int = 100,
        top_n: int = 50
    ) -> str:
        """
        Identify products with low sales that could be discontinued.
        
        **USE THIS TOOL WHEN:**
        - "¿Qué productos sugieres descatalogar?"
        - "Productos con poca venta"
        - "Productos candidatos para discontinuar"
        - "Productos de baja rotación"
        
        Logic:
        - Low monthly average sales (< threshold)
        - Analyzed over last N months
        - High inventory (potential waste if discontinued)
        - No recent backorders (no demand signal)
        
        Args:
            sales_threshold: Minimum monthly average sales to keep product (default: $1000)
            months_lookback: Months to analyze (default: 6)
            inventory_threshold: Minimum inventory to care about (default: 100 units)
            top_n: Number of candidates to return (default: 50)
        
        Returns:
            JSON with products ranked by discontinuation score
        """
        sql = f"""
            WITH product_metrics AS (
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.brand,
                    p.category,
                    -- Sales metrics
                    COALESCE(SUM(t.net_amount), 0) as total_sales,
                    COALESCE(SUM(t.net_amount) / {months_lookback}, 0) as avg_monthly_sales,
                    COALESCE(SUM(t.quantity), 0) as total_quantity_sold,
                    -- Inventory
                    COALESCE((SELECT SUM(inventory_qty) FROM inventory WHERE product_id = p.product_id), 0) as current_inventory,
                    -- Backorders (demand signal)
                    COALESCE((SELECT COUNT(*) FROM backorder 
                              WHERE product_id = p.product_id 
                              AND date >= CURRENT_DATE - INTERVAL '{months_lookback} months'), 0) as recent_backorders,
                    -- Last sale date
                    MAX(t.date) as last_sale_date,
                    EXTRACT(DAY FROM (CURRENT_DATE - MAX(t.date))) as days_since_last_sale
                FROM products p
                LEFT JOIN transactions t ON p.product_id = t.product_id 
                    AND t.transaction_type = 'SALE'
                    AND t.date >= CURRENT_DATE - INTERVAL '{months_lookback} months'
                WHERE p.state = true  -- Only active products
                GROUP BY p.product_id, p.product_name, p.brand, p.category
            )
            SELECT 
                product_id,
                product_name,
                brand,
                category,
                total_sales,
                avg_monthly_sales,
                total_quantity_sold,
                current_inventory,
                recent_backorders,
                last_sale_date,
                days_since_last_sale,
                -- Discontinuation score (0-100, higher = more likely to discontinue)
                CASE 
                    WHEN avg_monthly_sales = 0 THEN 100
                    ELSE LEAST(100, 
                        (({sales_threshold} - avg_monthly_sales) / {sales_threshold} * 40) +  -- 40% weight on low sales
                        (CASE WHEN recent_backorders = 0 THEN 30 ELSE 0 END) +  -- 30% weight if no backorders
                        (CASE WHEN current_inventory > {inventory_threshold} THEN 20 ELSE 0 END) +  -- 20% weight on high inventory
                        (LEAST(10, days_since_last_sale / 30))  -- 10% weight on days inactive
                    )
                END as discontinuation_score,
                CASE 
                    WHEN avg_monthly_sales < {sales_threshold} / 2 AND recent_backorders = 0 THEN 'high'
                    WHEN avg_monthly_sales < {sales_threshold} THEN 'medium'
                    ELSE 'low'
                END as discontinuation_risk
            FROM product_metrics
            WHERE avg_monthly_sales < {sales_threshold}
                OR (recent_backorders = 0 AND total_quantity_sold < 10)
            ORDER BY discontinuation_score DESC, current_inventory DESC
            LIMIT {top_n}
        """
        
        queries_executed.append({
            "type": "sql",
            "database": "client_data",
            "query": sql,
            "params": [],
            "source": "growth_analysis_tool"
        })
        
        pool = await get_client_db_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql)
                
                if not rows:
                    return json.dumps({
                        "message": "No discontinuation candidates found",
                        "products": []
                    })
                
                products_data = []
                for row in rows:
                    products_data.append({
                        "product_id": row['product_id'],
                        "product_name": row['product_name'],
                        "brand": row['brand'],
                        "category": row['category'],
                        "total_sales": float(row['total_sales']),
                        "avg_monthly_sales": float(row['avg_monthly_sales']),
                        "total_quantity_sold": float(row['total_quantity_sold']),
                        "current_inventory": int(row['current_inventory']),
                        "recent_backorders": int(row['recent_backorders']),
                        "last_sale_date": row['last_sale_date'].strftime('%Y-%m-%d') if row['last_sale_date'] else 'Never',
                        "days_since_last_sale": int(row['days_since_last_sale']) if row['days_since_last_sale'] is not None else 9999,
                        "discontinuation_score": float(row['discontinuation_score']),
                        "discontinuation_risk": row['discontinuation_risk']
                    })
                
                result = {
                    "criteria": {
                        "sales_threshold": sales_threshold,
                        "months_analyzed": months_lookback,
                        "inventory_threshold": inventory_threshold
                    },
                    "total_candidates": len(products_data),
                    "products": products_data
                }
                
                return json.dumps(result)
        finally:
            await pool.close()
    
    return get_discontinuation_candidates
