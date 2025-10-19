from tools.base import BaseTool
import boto3
import json
from typing import Dict, Any
from config import get_settings
import asyncpg

settings = get_settings()

class VectorTool(BaseTool):
    def __init__(self):
        super().__init__()
        self.bedrock = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        self.pool = None
    
    async def _get_pool(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=settings.postgres_host,
                port=settings.postgres_port,
                database=settings.postgres_db,
                user=settings.postgres_user,
                password=settings.postgres_password
            )
        return self.pool
    
    def _get_embedding(self, text: str) -> list:
        try:
            response = self.bedrock.invoke_model(
                modelId='amazon.titan-embed-text-v1',
                body=json.dumps({"inputText": text}),
                contentType='application/json',
                accept='application/json'
            )
            return json.loads(response['body'].read())['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return None
    
    async def execute(self, query: str, category: str) -> Dict[str, Any]:
        embedding = self._get_embedding(query)
        if not embedding:
            return self.format_error("Failed to generate embedding")
        
        return await self.search(query, "default", category, embedding)
    
    async def search(self, query: str, tenant_id: str, category: str = "products", embedding: list = None) -> Dict[str, Any]:
        if not embedding:
            embedding = self._get_embedding(query)
        
        if not embedding:
            return self.format_error("Failed to generate embedding")
        
        table_map = {
            "products": ("products", "product_id", "product_name", "vt_product_name"),
            "clients": ("clients", "client_id", "client_name", "vt_client_name"),
            "locations": ("locations", "location_id", "location_name", "vt_location_name")
        }
        
        if category not in table_map:
            return self.format_error(f"Unknown category: {category}")
        
        table, id_col, name_col, vector_col = table_map[category]
        
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                sql = f"""
                    SELECT {id_col}, {name_col},
                           1 - ({vector_col} <=> $1::vector) as similarity
                    FROM {table}
                    WHERE {vector_col} IS NOT NULL
                    ORDER BY {vector_col} <=> $1::vector
                    LIMIT 10
                """
                rows = await conn.fetch(sql, embedding)
                return self.format_result([dict(row) for row in rows])
        except Exception as e:
            return self.format_error(str(e))

