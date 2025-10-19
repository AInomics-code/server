from langchain_aws import ChatBedrock
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from config import get_settings
from prompts import load_prompt
from typing import Dict, Any, List

settings = get_settings()

class DynamicAgent:
    """
    LangGraph agent for dynamic queries that need reasoning and custom SQL generation.
    
    Architecture:
    - Uses Claude Sonnet via AWS Bedrock
    - ReAct pattern (Reasoning + Acting)
    - Tools are easily extensible
    - Automatic retry on errors
    """
    
    def __init__(self):
        self.llm = self._initialize_llm()
        self.tools = []
        self.queries_executed = []
        
        # Load tools
        self._load_tools()
        
        # Create agent
        self.agent = create_react_agent(
            self.llm,
            self.tools
        )
        
        self.system_prompt = self._get_system_prompt()
    
    def _initialize_llm(self):
        """Initialize Claude Sonnet via AWS Bedrock"""
        return ChatBedrock(
            model_id=settings.bedrock_model_id,
            region_name=settings.aws_region,
            credentials_profile_name=None,
            provider="anthropic",
            model_kwargs={
                "temperature": 0.3,
                "max_tokens": 2000
            }
        )
    
    def _get_system_prompt(self) -> str:
        """Load system prompt from file"""
        return load_prompt("dynamic_agent.txt")
    
    def _load_tools(self):
        """Load all available tools - EASY TO EXTEND"""
        from agents.tools.sql_tool import create_sql_tool
        from agents.tools.vector_tool import create_vector_tool
        
        # Add SQL tool
        self.tools.append(create_sql_tool(self.queries_executed))
        
        # Add vector search tool
        self.tools.append(create_vector_tool(self.queries_executed))
        
        # FUTURE: Add more tools here
        # self.tools.append(create_analytics_tool())
        # self.tools.append(create_prediction_tool())
        # self.tools.append(create_external_api_tool())
    
    async def execute(self, query: str, session_id: str) -> Dict[str, Any]:
        """
        Execute a dynamic query using LangGraph agent
        
        Args:
            query: User's natural language query
            session_id: Session identifier for conversation tracking
            
        Returns:
            Dict with answer, queries_executed, and metadata
        """
        self.queries_executed = []
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=query)
        ]
        
        config = {
            "configurable": {
                "thread_id": session_id
            },
            "recursion_limit": 15
        }
        
        print(f"\n{'='*70}")
        print(f"[DYNAMIC AGENT] Starting execution")
        print(f"[DYNAMIC AGENT] Query: {query}")
        print(f"[DYNAMIC AGENT] Session: {session_id}")
        print(f"{'='*70}\n")
        
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
            
            print(f"\n{'='*70}")
            print(f"[DYNAMIC AGENT] Execution completed")
            print(f"[DYNAMIC AGENT] Total tools used: {len(self.queries_executed)}")
            print(f"{'='*70}\n")
            
            return {
                "answer": answer,
                "data": None,
                "source": "dynamic",
                "queries_executed": self.queries_executed
            }
        
        except Exception as e:
            print(f"\n[DYNAMIC AGENT ERROR] {str(e)}\n")
            return {
                "answer": f"Error ejecutando la consulta: {str(e)}",
                "data": None,
                "source": "dynamic",
                "queries_executed": self.queries_executed
            }

