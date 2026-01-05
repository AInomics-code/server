from langchain_core.tools import tool
from typing import Dict, Any, List
from config import get_settings

settings = get_settings()

def create_sql_tool(queries_executed_ref: List[Dict]) -> tool:
    """
    Creates a SQL query execution tool for LangGraph agent
    
    Args:
        queries_executed_ref: Reference to list where executed queries are logged
        
    Returns:
        LangChain tool function
    """
    
    @tool
    async def query_database(sql: str, explanation: str = "") -> Dict[str, Any]:
        """Execute SQL queries on the client database.
        
        Use this tool for querying business data from the client database.
        
        Available tables (DBT transformed):
        - products (product_id, product_name, code, state, brand, category, subcategory, measure, outsourced)
        - inventory (product_id, inventory_qty, location_id)
        - locations (location_id, location_name, city)
        - transactions (date, transaction_type, product_id, unit_price, quantity, unit_cost, gross_amount, net_amount, discount_amount, client_id, seller_name)
        - clients (client_id, client_name, client_group, country, state, district, city)
        - backorder (date, order_id, location_id, client_id, seller_name, product_id, expected_delivery_date, actual_delivery_date, days_delayed, order_qty, delivery_qty, backorder_qty, unit_price)
        - budgets (date, budget, client_id, client_code, client_name)
        
        IMPORTANT:
        - Always use JOINs to get readable names (not just IDs)
        - Specify column names explicitly (never use SELECT *)
        - Include appropriate WHERE clauses and filters
        - For sales: filter transactions WHERE transaction_type = 'SALE'
        - backorder is SINGULAR, not plural
        - locations use location_id, not id
        
        Args:
            sql: Complete SQL query to execute
            explanation: Brief explanation of what this query retrieves
            
        Returns:
            Dict with success status, data, or error message
        """
        from tools.sql import SQLTool
        
        print(f"\n{'─'*60}")
        print(f"[TOOL: query_database]")
        print(f"SQL: {sql}")
        print(f"Explanation: {explanation}")
        print(f"{'─'*60}")
        
        sql_tool = SQLTool()
        result = await sql_tool.execute(sql)
        
        # Log the query
        queries_executed_ref.append({
            "type": "sql",
            "database": settings.client_data_db,
            "query": sql,
            "explanation": explanation,
            "source": "dynamic_agent",
            "success": result.get('success', False),
            "rows_returned": len(result.get('data', []))
        })
        
        if result.get('error'):
            print(f"❌ SQL Error: {result['error']}\n")
            return {
                "success": False,
                "error": result['error'],
                "message": "SQL execution failed. Analyze the error and correct the query."
            }
        else:
            row_count = len(result.get('data', []))
            print(f"✅ SQL Success: {row_count} rows returned\n")
            return result
    
    return query_database

