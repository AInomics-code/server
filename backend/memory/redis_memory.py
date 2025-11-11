import redis.asyncio as redis
import json
from typing import List, Dict, Optional
from config import get_settings

settings = get_settings()

class RedisMemory:
    def __init__(self):
        self.client = None
    
    async def _get_client(self):
        if not self.client:
            # Construct Redis URL
            redis_url = f"redis://{settings.redis_host}:{settings.redis_port}"
            
            # Add password if provided
            connection_kwargs = {
                "decode_responses": True
            }
            
            if settings.redis_password:
                connection_kwargs["password"] = settings.redis_password
            
            # For Redis clusters/replicas, force read-write mode
            # This ensures we connect to master for write operations
            self.client = await redis.from_url(
                redis_url,
                **connection_kwargs
            )
            
            # Test if we can write (will fail if read-only replica)
            try:
                await self.client.ping()
            except redis.ReadOnlyError:
                print(f"⚠️  WARNING: Connected to read-only Redis replica at {settings.redis_host}")
                print(f"⚠️  Check REDIS_HOST environment variable - should point to master node")
                raise ConnectionError(
                    f"Redis connection at {settings.redis_host}:{settings.redis_port} is read-only. "
                    "Please update REDIS_HOST to point to the master/primary node."
                )
        
        return self.client
    
    async def add_message(self, session_id: str, role: str, content: str):
        client = await self._get_client()
        message = json.dumps({"role": role, "content": content})
        await client.rpush(f"session:{session_id}:messages", message)
        await client.expire(f"session:{session_id}:messages", settings.session_ttl_seconds)
    
    async def get_messages(self, session_id: str, limit: int = 20) -> List[Dict]:
        client = await self._get_client()
        messages = await client.lrange(f"session:{session_id}:messages", -limit, -1)
        return [json.loads(msg) for msg in messages]
    
    async def get_context(self, session_id: str) -> List[Dict]:
        messages = await self.get_messages(session_id, limit=10)
        return messages
    
    async def clear_session(self, session_id: str):
        client = await self._get_client()
        await client.delete(f"session:{session_id}:messages")
    
    async def set_cache(self, key: str, value: any, ttl: int = 300):
        client = await self._get_client()
        await client.setex(key, ttl, json.dumps(value))
    
    async def get_cache(self, key: str) -> Optional[any]:
        client = await self._get_client()
        value = await client.get(key)
        return json.loads(value) if value else None

