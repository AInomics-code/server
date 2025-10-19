from langchain_aws import ChatBedrock
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from config import get_settings
from typing import Dict, Any, List
import asyncio

settings = get_settings()

class LangGraphAgent:
    def __init__(self):
        self.llm = ChatBedrock(
            model_id=settings.bedrock_model_id,
            region_name=settings.aws_region,
            credentials_profile_name=None,
            provider="anthropic",
            model_kwargs={
                "temperature": 0.3,
                "max_tokens": 2000
            }
        )
        
        self.tools = self._create_tools()
        self.memory = MemorySaver()
        self.agent = create_react_agent(
            self.llm,
            self.tools,
            checkpointer=self.memory
        )
        
        self.system_prompt = """You are a data analyst assistant. CRITICAL RULES:
1. NEVER invent, mock, or make up data
2. Only report actual results from tool executions
3. If a query fails, analyze the error and retry with corrected SQL
4. If no data exists, say "No hay datos disponibles" - DO NOT invent numbers
5. Use JOINs to make results readable (include product/client/location names)
6. Always specify column names, never use SELECT *
7. When you get successful results, provide a clear summary to the user"""
        
        self.queries_executed = []
    
    def _create_tools(self):
        from tools.sql import SQLTool
        from tools.vector_search import VectorSearchTool
        
        sql_tool_instance = SQLTool()
        vector_tool_instance = VectorSearchTool()
        
        @tool
        async def query_database(sql: str, explanation: str = "") -> Dict[str, Any]:
            """Execute SQL queries on the client database. Use this for:
            - Inventory queries (table: inventory, products, locations)
            - Sales data (table: sales, clients, products)
            - Backorders (table: backorders, products)
            - Client information (table: clients)
            Available tables: products, inventory, locations, sales, clients, backorders
            Always JOIN with products table to get product names when querying inventory or backorders.
            
            Args:
                sql: Complete SQL query to execute. Include JOINs for readable results.
                explanation: Brief explanation of what this query retrieves
            """
            print(f"\n[LANGGRAPH TOOL] query_database")
            print(f"[LANGGRAPH TOOL] SQL: {sql}")
            print(f"[LANGGRAPH TOOL] Explanation: {explanation}")
            
            result = await sql_tool_instance.execute(sql)
            
            self.queries_executed.append({
                "type": "sql",
                "database": settings.client_data_db,
                "query": sql,
                "explanation": explanation,
                "source": "langgraph",
                "success": result.get('success', False)
            })
            
            if result.get('error'):
                print(f"[LANGGRAPH TOOL] SQL Error: {result['error']}")
                return {
                    "success": False,
                    "error": result['error'],
                    "message": "SQL execution failed. Analyze the error and correct the query."
                }
            else:
                print(f"[LANGGRAPH TOOL] SQL Success: {len(result.get('data', []))} rows")
                return result
        
        @tool
        async def vector_search(query: str, category: str = "products") -> Dict[str, Any]:
            """Semantic search to find product_id, client_id, or location_id by name or description.
            Use this BEFORE querying database when you need to identify a specific product/client/location from natural language.
            Returns the ID that can be used in SQL queries.
            
            Args:
                query: Natural language search term (e.g., 'tortillas de nopal')
                category: What type of entity to search for (products, clients, or locations)
            """
            print(f"\n[LANGGRAPH TOOL] vector_search")
            print(f"[LANGGRAPH TOOL] Query: {query}")
            print(f"[LANGGRAPH TOOL] Category: {category}")
            
            result = await vector_tool_instance.execute(query, category=category)
            
            self.queries_executed.append({
                "type": "vector_search",
                "database": "main_db",
                "target": category,
                "search_term": query,
                "source": "langgraph",
                "success": result.get('success', False)
            })
            
            if result.get('error'):
                print(f"[LANGGRAPH TOOL] Vector Search Error: {result['error']}")
                return {
                    "success": False,
                    "error": result['error'],
                    "message": "Vector search failed"
                }
            else:
                print(f"[LANGGRAPH TOOL] Vector Search Success: {len(result.get('data', []))} results")
                return result
        
        return [query_database, vector_search]
    
    async def execute(self, query: str, context: List[Dict], tenant_id: str, session_id: str) -> Dict[str, Any]:
        self.queries_executed = []
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=query)
        ]
        
        config = {
            "configurable": {
                "thread_id": session_id
            },
            "recursion_limit": 10
        }
        
        print(f"\n[LANGGRAPH] Starting agent execution")
        print(f"[LANGGRAPH] Query: {query}")
        print(f"[LANGGRAPH] Session: {session_id}\n")
        
        try:
            result = await self.agent.ainvoke(
                {"messages": messages},
                config=config
            )
            
            final_messages = result.get("messages", [])
            
            if final_messages:
                last_message = final_messages[-1]
                answer = last_message.content if hasattr(last_message, 'content') else str(last_message)
            else:
                answer = "No pude procesar tu consulta."
            
            print(f"\n[LANGGRAPH] Execution completed")
            print(f"[LANGGRAPH] Total queries executed: {len(self.queries_executed)}\n")
            
            return {
                "answer": answer,
                "data": None,
                "source": "langgraph",
                "queries_executed": self.queries_executed
            }
        
        except Exception as e:
            print(f"\n[LANGGRAPH ERROR] {str(e)}\n")
            return {
                "answer": f"Error ejecutando la consulta: {str(e)}",
                "data": None,
                "source": "langgraph",
                "queries_executed": self.queries_executed
            }

