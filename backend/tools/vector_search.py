from tools.base import BaseTool
import boto3
import json
from typing import Dict, Any, List, Optional
from config import get_settings
import psycopg2

settings = get_settings()

class VectorSearchTool(BaseTool):
    def __init__(self):
        super().__init__()
        self.bedrock = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
    
    def _get_embedding(self, text: str) -> Optional[list]:
        try:
            body = json.dumps({"inputText": text})
            response = self.bedrock.invoke_model(
                modelId='amazon.titan-embed-text-v2:0',
                body=body,
                contentType='application/json',
                accept='application/json'
            )
            response_body = json.loads(response['body'].read())
            return response_body.get('embedding')
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
    
    def _get_vector_db_connection(self):
        return psycopg2.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            database=settings.postgres_db,
            user=settings.postgres_user,
            password=settings.postgres_password
        )
    
    async def execute(self, query: str, category: str = "products", limit: int = 5) -> Dict[str, Any]:
        embedding = self._get_embedding(query)
        if not embedding:
            return self.format_error("Failed to generate embedding")
        
        return await self.search(query, category, embedding, limit)
    
    async def search(self, query: str, category: str, embedding: list, limit: int = 5) -> Dict[str, Any]:
        table_config = {
            "products": {
                "table": "products",
                "vector_column": "vt_product_name",
                "id_column": "product_id",
                "name_column": "product_name",
                "additional_columns": ["product_brand", "product_category"]
            },
            "products_by_brand": {
                "table": "products",
                "vector_column": "vt_product_brand",
                "id_column": "product_id",
                "name_column": "product_name",
                "additional_columns": ["product_brand", "product_category"]
            },
            "products_by_category": {
                "table": "products",
                "vector_column": "vt_product_category",
                "id_column": "product_id",
                "name_column": "product_name",
                "additional_columns": ["product_brand", "product_category"]
            },
            "clients": {
                "table": "clients",
                "vector_column": "vt_client_name",
                "id_column": "client_id",
                "name_column": "client_name",
                "additional_columns": ["client_group"]
            },
            "locations": {
                "table": "locations",
                "vector_column": "vt_location_name",
                "id_column": "location_id",
                "name_column": "location_name",
                "additional_columns": []
            }
        }
        
        if category not in table_config:
            return self.format_error(f"Unknown category: {category}")
        
        config = table_config[category]
        
        try:
            conn = self._get_vector_db_connection()
            cur = conn.cursor()
            
            columns = [config["id_column"], config["name_column"]] + config["additional_columns"]
            columns_str = ', '.join(columns)
            
            sql = f"""
                SELECT 
                    {columns_str},
                    1 - ({config["vector_column"]} <=> %s::vector) as similarity
                FROM {config["table"]}
                WHERE {config["vector_column"]} IS NOT NULL
                ORDER BY {config["vector_column"]} <=> %s::vector
                LIMIT %s
            """
            
            print(f"\n[VECTOR SEARCH] Database: main_db")
            print(f"[VECTOR SEARCH] Table: {config['table']}")
            print(f"[VECTOR SEARCH] Search query: '{query}'")
            print(f"[VECTOR SEARCH] Limit: {limit}")
            
            cur.execute(sql, (embedding, embedding, limit))
            rows = cur.fetchall()
            
            print(f"[VECTOR SEARCH] Results found: {len(rows)}\n")
            
            results = []
            for row in rows:
                result = {
                    "id": row[0],
                    "name": row[1],
                    "similarity": row[-1]
                }
                if len(row) > 3:
                    result["additional"] = row[2:-1]
                results.append(result)
            
            cur.close()
            conn.close()
            
            return self.format_result(results)
        
        except Exception as e:
            return self.format_error(str(e))
    
    async def search_product(self, query: str, top_n: int = 1) -> Optional[str]:
        print(f"[VECTOR_SEARCH] Searching for product: '{query}' (top_n={top_n})")
        result = await self.execute(query, category="products", limit=top_n)
        print(f"[VECTOR_SEARCH] Result: {result}")
        if result.get("success") and result.get("data"):
            product_id = result["data"][0]["id"]
            print(f"[VECTOR_SEARCH] Found product_id: {product_id}")
            return product_id
        print(f"[VECTOR_SEARCH] No product found")
        return None
    
    async def search_client(self, query: str) -> Optional[str]:
        result = await self.execute(query, category="clients", limit=1)
        if result.get("success") and result.get("data"):
            return result["data"][0]["id"]
        return None
    
    async def search_location(self, query: str) -> Optional[str]:
        result = await self.execute(query, category="locations", limit=1)
        if result.get("success") and result.get("data"):
            return result["data"][0]["id"]
        return None

