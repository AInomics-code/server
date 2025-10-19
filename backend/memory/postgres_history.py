import asyncpg
from typing import List, Dict
from config import get_settings

settings = get_settings()

class PostgresHistory:
    def __init__(self):
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
    
    async def save_conversation(self, session_id: str, tenant_id: str, user_id: str, messages: List[Dict]):
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            for msg in messages:
                await conn.execute("""
                    INSERT INTO conversation_history 
                    (tenant_id, user_id, session_id, message_type, content, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                """, tenant_id, user_id, session_id, msg["role"], msg["content"])
    
    async def get_session_history(self, session_id: str) -> List[Dict]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT message_type, content, created_at
                FROM conversation_history
                WHERE session_id = $1
                ORDER BY created_at ASC
            """, session_id)
            return [dict(row) for row in rows]

