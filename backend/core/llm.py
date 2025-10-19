import boto3
import json
from config import get_settings
from typing import AsyncGenerator, List, Dict, Any
import asyncio
from functools import partial

settings = get_settings()

class LLMClient:
    def __init__(self):
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        self.tools = self._define_tools()
    
    def _define_tools(self) -> List[Dict]:
        return [
            {
                "name": "query_database",
                "description": """Execute SQL queries on the client database. Use this for:
- Inventory queries (table: inventory, products, locations)
- Sales data (table: sales, clients, products)
- Backorders (table: backorders, products)
- Client information (table: clients)
Available tables: products, inventory, locations, sales, clients, backorders
Always JOIN with products table to get product names when querying inventory or backorders.""",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "sql": {
                            "type": "string", 
                            "description": "Complete SQL query to execute. Include JOINs for readable results."
                        },
                        "explanation": {
                            "type": "string", 
                            "description": "Brief explanation of what this query retrieves"
                        }
                    },
                    "required": ["sql", "explanation"]
                }
            },
            {
                "name": "vector_search",
                "description": """Semantic search to find product_id, client_id, or location_id by name or description.
Use this BEFORE querying database when you need to identify a specific product/client/location from natural language.
Returns the ID that can be used in SQL queries.""",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Natural language search term (e.g., 'tortillas de nopal')"
                        },
                        "category": {
                            "type": "string", 
                            "enum": ["products", "clients", "locations"],
                            "description": "What type of entity to search for"
                        }
                    },
                    "required": ["query", "category"]
                }
            }
        ]
    
    async def execute_with_tools(self, query: str, context: List[Dict], tenant_id: str) -> Dict[str, Any]:
        system_prompt = """You are a data analyst assistant. CRITICAL RULES:
1. NEVER invent, mock, or make up data
2. Only report actual results from tool executions
3. If a query fails, analyze the error and retry with corrected SQL
4. If no data exists, say "No hay datos disponibles" - DO NOT invent numbers
5. Use JOINs to make results readable (include product/client/location names)
6. Always specify column names, never use SELECT *"""
        
        messages = [{"role": "user", "content": f"{system_prompt}\n\nUser query: {query}"}] + context
        queries_executed = []
        
        max_iterations = 5
        iteration = 0
        loop = asyncio.get_event_loop()
        
        while iteration < max_iterations:
            iteration += 1
            print(f"\n[AGENT LOOP] Iteration {iteration}/{max_iterations}")
            
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "temperature": 0.3,
                "tools": self.tools,
                "messages": messages
            })
            
            response = await loop.run_in_executor(
                None,
                partial(
                    self.client.invoke_model,
                    modelId=settings.bedrock_model_id,
                    body=body
                )
            )
            
            response_body = json.loads(response['body'].read())
            stop_reason = response_body.get('stop_reason')
            
            print(f"[AGENT LOOP] Stop reason: {stop_reason}")
            
            if stop_reason == "tool_use":
                tool_results, tool_queries = await self._execute_tools(response_body['content'], tenant_id)
                queries_executed.extend(tool_queries)
                
                messages.append({"role": "assistant", "content": response_body['content']})
                messages.append({"role": "user", "content": tool_results})
                
                print(f"[AGENT LOOP] Tools executed, continuing loop...")
                
            elif stop_reason == "end_turn":
                print(f"[AGENT LOOP] Agent finished after {iteration} iterations\n")
                answer = response_body['content'][0]['text'] if response_body.get('content') else "Error processing response"
                break
            else:
                print(f"[AGENT LOOP] Unexpected stop reason: {stop_reason}\n")
                answer = response_body['content'][0]['text'] if response_body.get('content') else "Error processing response"
                break
        
        if iteration >= max_iterations:
            print(f"[AGENT LOOP] Max iterations reached\n")
            answer = "Lo siento, no pude completar la consulta después de varios intentos."
        
        return {
            "answer": answer,
            "data": None,
            "source": "llm",
            "queries_executed": queries_executed
        }
    
    async def stream_with_tools(self, query: str, context: List[Dict], tenant_id: str) -> AsyncGenerator[str, None]:
        messages = context + [{"role": "user", "content": query}]
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "temperature": 0.3,
            "tools": self.tools,
            "messages": messages
        })
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                self.client.invoke_model_with_response_stream,
                modelId=settings.bedrock_model_id,
                body=body
            )
        )
        
        stream = response.get('body')
        if stream:
            for event in stream:
                chunk = event.get('chunk')
                if chunk:
                    chunk_data = json.loads(chunk.get('bytes').decode())
                    if chunk_data.get('type') == 'content_block_delta':
                        if chunk_data.get('delta', {}).get('type') == 'text_delta':
                            text = chunk_data['delta'].get('text', '')
                            if text:
                                yield text
                                await asyncio.sleep(0)
    
    async def execute_complex(self, query: str, context: List[Dict], tenant_id: str) -> Dict[str, Any]:
        return await self.execute_with_tools(query, context, tenant_id)
    
    async def stream_complex(self, query: str, context: List[Dict], tenant_id: str) -> AsyncGenerator[str, None]:
        async for chunk in self.stream_with_tools(query, context, tenant_id):
            yield chunk
    
    async def _execute_tools(self, content: List, tenant_id: str) -> tuple[List[Dict], List[Dict]]:
        from tools.sql import SQLTool
        from tools.vector_search import VectorSearchTool
        from config import get_settings
        
        settings_local = get_settings()
        sql_tool = SQLTool()
        vector_tool = VectorSearchTool()
        
        tool_results = []
        queries_executed = []
        
        for block in content:
            if isinstance(block, dict) and block.get('type') == "tool_use":
                tool_name = block.get('name')
                tool_input = block.get('input', {})
                tool_use_id = block.get('id')
                
                print(f"\n[TOOL CALL] Tool: {tool_name}")
                print(f"[TOOL CALL] Input: {tool_input}")
                print(f"[TOOL CALL] ID: {tool_use_id}")
                
                try:
                    if tool_name == "query_database":
                        sql = tool_input.get('sql')
                        explanation = tool_input.get('explanation', '')
                        result = await sql_tool.execute(sql)
                        
                        if result.get('error'):
                            result_content = json.dumps({
                                "success": False,
                                "error": result['error'],
                                "message": "SQL execution failed. Please analyze the error and correct the query."
                            }, indent=2)
                            print(f"[TOOL ERROR] SQL failed: {result['error']}")
                        else:
                            result_content = json.dumps(result, indent=2)
                            print(f"[TOOL RESULT] SQL success: {len(result.get('data', []))} rows")
                        
                        queries_executed.append({
                            "type": "sql",
                            "database": settings_local.client_data_db,
                            "query": sql,
                            "explanation": explanation,
                            "source": "llm_generated",
                            "success": result.get('success', False)
                        })
                    
                    elif tool_name == "vector_search":
                        query = tool_input.get('query')
                        category = tool_input.get('category', 'products')
                        result = await vector_tool.execute(query, category=category)
                        
                        if result.get('error'):
                            result_content = json.dumps({
                                "success": False,
                                "error": result['error'],
                                "message": "Vector search failed"
                            }, indent=2)
                            print(f"[TOOL ERROR] Vector search failed: {result['error']}")
                        else:
                            result_content = json.dumps(result, indent=2)
                            print(f"[TOOL RESULT] Vector search: {len(result.get('data', []))} results")
                        
                        queries_executed.append({
                            "type": "vector_search",
                            "database": "main_db",
                            "target": category,
                            "search_term": query,
                            "source": "llm_generated",
                            "success": result.get('success', False)
                        })
                    
                    else:
                        result_content = json.dumps({"error": f"Unknown tool: {tool_name}"})
                        print(f"[TOOL ERROR] Unknown tool: {tool_name}")
                
                except Exception as e:
                    result_content = json.dumps({
                        "success": False,
                        "error": str(e),
                        "message": "Exception during tool execution"
                    })
                    print(f"[TOOL EXCEPTION] {str(e)}\n")
                
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use_id,
                    "content": result_content
                })
        
        return tool_results, queries_executed

