from enum import Enum
import boto3
import json
from config import get_settings
from prompts import load_prompt

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
    
    async def classify(self, query: str) -> QueryType:
        cache_key = hash(query.lower().strip())
        if cache_key in self.cache:
            return self.cache[cache_key]
        
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
            classification = response_body['content'][0]['text'].strip().upper()
            
            if "SIMPLE" in classification:
                query_type = QueryType.SIMPLE
            else:
                query_type = QueryType.DYNAMIC
            
            self.cache[cache_key] = query_type
            return query_type
        
        except Exception as e:
            print(f"Classification error: {e}")
            return QueryType.DYNAMIC

