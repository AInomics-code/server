from tools.base import BaseTool
import asyncpg
from config import get_settings
from typing import Dict, Any, Optional

settings = get_settings()

class SQLTool(BaseTool):
    def __init__(self):
        super().__init__()
        self.pool = None
    
    async def _get_pool(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=settings.client_data_host,
                port=settings.client_data_port,
                database=settings.client_data_db,
                user=settings.client_data_user,
                password=settings.client_data_password,
                min_size=5,
                max_size=20
            )
        return self.pool
    
    async def execute(self, sql: str, params: tuple = None) -> Dict[str, Any]:
        try:
            print(f"\n[SQL QUERY] Database: {settings.client_data_db}")
            print(f"[SQL QUERY] Query: {sql.strip()}")
            if params:
                print(f"[SQL QUERY] Params: {params}")
            
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *(params or ()))
                result = self.format_result([dict(row) for row in rows])
                result["query_executed"] = sql.strip()
                if params:
                    result["query_params"] = params
                print(f"[SQL QUERY] Rows returned: {len(rows)}\n")
                return result
        except Exception as e:
            print(f"[SQL ERROR] {str(e)}\n")
            return self.format_error(str(e))
    
    async def query_inventory(self, query: str, tenant_id: str, product_id: Optional[str] = None) -> Dict[str, Any]:
        if product_id:
            sql = """
                SELECT p.product_name, i.inventory_qty, l.location_name
                FROM inventory i
                JOIN products p ON i.product_id = p.product_id
                JOIN locations l ON i.location_id = l.id
                WHERE i.product_id = $1
                ORDER BY i.inventory_qty DESC
            """
            return await self.execute(sql, (product_id,))
        else:
            sql = """
                SELECT p.product_name, i.inventory_qty, l.location_name
                FROM inventory i
                JOIN products p ON i.product_id = p.product_id
                JOIN locations l ON i.location_id = l.id
                LIMIT 20
            """
            return await self.execute(sql)
    
    async def query_sales(self, query: str, tenant_id: str) -> Dict[str, Any]:
        sql = """
            SELECT 
                DATE(date) as sale_date,
                SUM(net_amount) as total_sales,
                COUNT(*) as transactions
            FROM sales
            WHERE date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(date)
            ORDER BY sale_date DESC
            LIMIT 30
        """
        return await self.execute(sql)
    
    async def generic_query(self, query: str, tenant_id: str) -> Dict[str, Any]:
        return self.format_result({"message": "Generic query not implemented yet"})

