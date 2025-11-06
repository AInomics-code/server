from enum import Enum
import boto3
import json
from config import get_settings
from prompts import load_prompt
from typing import List, Dict, Optional

settings = get_settings()

class QueryType(Enum):
    SIMPLE = "simple"
    DYNAMIC = "dynamic"

class QueryRouter:
    def __init__(self):
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        self.cache = {}
        self.prompt_template = load_prompt("router_classifier.txt")
    
    async def classify(self, query: str, conversation_history: Optional[List[Dict]] = None) -> QueryType:
        # Build context from conversation history
        context_str = ""
        if conversation_history and len(conversation_history) > 0:
            # Get last 2 exchanges (4 messages max: user -> assistant -> user -> assistant)
            recent_messages = conversation_history[-4:]
            context_parts = []
            for msg in recent_messages:
                role = msg.get("role", "")
                content = msg.get("content", "")[:100]  # Limit to 100 chars per message
                if role == "user":
                    context_parts.append(f"User asked: {content}")
                elif role == "assistant":
                    context_parts.append(f"Assistant replied: {content}")
            context_str = "\n".join(context_parts)
        
        # Include context in cache key if present
        cache_key = hash(f"{query.lower().strip()}|{context_str}")
        if cache_key in self.cache:
            cached_result = self.cache[cache_key]
            print(f"[ROUTER] 🔄 Cached: {query[:50]}... -> {cached_result.value}")
            return cached_result
        
        # Build prompt with context
        if context_str:
            prompt = f"Previous conversation:\n{context_str}\n\n{self.prompt_template.format(query=query)}"
        else:
            prompt = self.prompt_template.format(query=query)
        
        try:
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 10,
                "temperature": 0,
                "messages": [{"role": "user", "content": prompt}]
            })
            
            response = self.client.invoke_model(
                modelId=settings.classifier_model_id,
                body=body
            )
            
            response_body = json.loads(response['body'].read())
            raw_response = response_body['content'][0]['text'].strip()
            classification = raw_response.upper()
            
            if classification.startswith("SIMPLE"):
                query_type = QueryType.SIMPLE
            elif classification.startswith("DYNAMIC"):
                query_type = QueryType.DYNAMIC
            elif "DYNAMIC" in classification:
                query_type = QueryType.DYNAMIC
            elif "SIMPLE" in classification:
                query_type = QueryType.SIMPLE
            else:
                print(f"[ROUTER] ⚠️  Ambiguous classification: '{raw_response}', defaulting to DYNAMIC")
                query_type = QueryType.DYNAMIC
            
            context_info = f" (with context)" if context_str else ""
            print(f"[ROUTER] 🎯 Classified: {query[:50]}... -> {query_type.value}{context_info} (raw: '{raw_response}')")
            
            self.cache[cache_key] = query_type
            return query_type
        
        except Exception as e:
            print(f"[ROUTER] ❌ Classification error: {e}, defaulting to DYNAMIC")
            return QueryType.DYNAMIC
    
    def clear_cache(self):
        """Clear classification cache (useful after prompt changes)"""
        self.cache = {}
        print("[ROUTER] 🗑️  Cache cleared")

