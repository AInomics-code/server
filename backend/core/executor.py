from core.router import QueryType
from agents.dynamic_agent import DynamicAgent
from agents.simple_agent import SimpleAgent
from memory.redis_memory import RedisMemory
from typing import AsyncGenerator
from config import get_settings
import boto3
import json

settings = get_settings()

class QueryExecutor:
    def __init__(self):
        self.simple_agent = SimpleAgent()
        self.dynamic_agent = DynamicAgent()
        self.memory = RedisMemory()
        self.bedrock = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
    
    async def execute(self, query: str, query_type: QueryType, tenant_id: str, session_id: str) -> dict:
        if query_type == QueryType.SIMPLE:
            result = await self._execute_simple(query, session_id)
        else:  # DYNAMIC
            result = await self._execute_dynamic(query, session_id)
        
        return await self._format_for_frontend(result, query)
    
    async def execute_stream(self, query: str, query_type: QueryType, tenant_id: str, session_id: str) -> AsyncGenerator[str, None]:
        if query_type == QueryType.SIMPLE:
            result = await self._execute_simple(query, session_id)
            yield result["answer"]
        else:  # DYNAMIC
            result = await self._execute_dynamic(query, session_id)
            yield result["answer"]
    
    async def _execute_simple(self, query: str, session_id: str) -> dict:
        """Execute simple queries using Haiku agent with predefined tools"""
        return await self.simple_agent.execute(query, session_id)
    
    async def _execute_dynamic(self, query: str, session_id: str) -> dict:
        """Execute dynamic queries using Sonnet agent"""
        return await self.dynamic_agent.execute(query, session_id)
    
    async def _format_for_frontend(self, result: dict, original_query: str) -> dict:
        """Format agent response for frontend consumption"""
        formatted = {
            "message": result.get("answer", ""),
            "data": result.get("data"),
            "type": result.get("source", "agent"),
            "queries_executed": result.get("queries_executed", [])
        }
        
        return formatted

