from langchain_aws import ChatBedrock
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from config import get_settings
from prompts import load_prompt
from typing import Dict, Any, List

settings = get_settings()


class SimpleAgent:
    """
    Lightweight Haiku agent for SIMPLE queries (direct data lookup)
    
    Uses LangChain's native tool calling - no manual parsing needed.
    """
    
    def __init__(self):
        self.llm = self._initialize_llm()
        self.tools = []
        self.queries_executed = []
        
        self._load_tools()
        
        # Create prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create agent with tool calling
        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        
        # Create executor
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5,
            early_stopping_method="generate",
            handle_parsing_errors=True,
            return_intermediate_steps=True
        )
    
    def _initialize_llm(self):
        """Initialize Claude Haiku for fast, simple queries"""
        return ChatBedrock(
            model_id=settings.classifier_model_id,  # Haiku
            region_name=settings.aws_region,
            credentials_profile_name=None,
            provider="anthropic",
            model_kwargs={
                "temperature": 0,
                "max_tokens": 1500
            }
        )
    
    def _get_system_prompt(self) -> str:
        """Load system prompt from file"""
        return load_prompt("simple_agent.txt")
    
    def _load_tools(self):
        """Load simple data retrieval tools"""
        from agents.tools.simple_sql_tools import (
            create_inventory_tool,
            create_sales_tool,
            create_backorders_tool,
            create_product_search_tool,
            create_inventory_summary_tool,
            create_sales_summary_tool,
            create_backorders_summary_tool
        )
        
        # Vector search
        self.tools.append(create_product_search_tool(self.queries_executed))
        
        # Summary tools (for totals/aggregations - no limits)
        self.tools.append(create_inventory_summary_tool(self.queries_executed))
        self.tools.append(create_sales_summary_tool(self.queries_executed))
        self.tools.append(create_backorders_summary_tool(self.queries_executed))
        
        # Detail tools (for individual records - with limits)
        self.tools.append(create_inventory_tool(self.queries_executed))
        self.tools.append(create_sales_tool(self.queries_executed))
        self.tools.append(create_backorders_tool(self.queries_executed))
    
    async def execute(self, query: str, session_id: str, user_id: str) -> Dict[str, Any]:
        """Execute a simple data lookup query"""
        self.queries_executed = []
        
        print(f"\n{'='*70}")
        print(f"[SIMPLE AGENT] Query: {query}")
        print(f"{'='*70}\n")
        
        # LangSmith config with metadata
        config = RunnableConfig(
            metadata={
                "conversation_id": session_id,
                "user_id": user_id,
                "agent_type": "simple",
                "model": "haiku"
            },
            tags=[
                settings.environment if hasattr(settings, 'environment') else "development",
                "simple_agent",
                "haiku"
            ]
        )
        
        try:
            # LangChain handles everything
            result = await self.agent_executor.ainvoke(
                {"input": query},
                config=config
            )
            
            output = result.get("output", "No pude procesar tu consulta.")
            
            # Extract text from list format if needed
            if isinstance(output, list):
                answer = ""
                for item in output:
                    if isinstance(item, dict) and item.get('type') == 'text':
                        answer += item.get('text', '')
                    elif isinstance(item, str):
                        answer += item
                answer = answer.strip() or "No pude procesar tu consulta."
            else:
                answer = output
            
            # Extract data from intermediate steps (JSON from summary tools)
            data = None
            intermediate_steps = result.get("intermediate_steps", [])
            for action, observation in intermediate_steps:
                if isinstance(observation, str):
                    try:
                        import json
                        parsed = json.loads(observation)
                        if isinstance(parsed, dict) and any(
                            k in parsed for k in ['total_quantity', 'total_value_usd', 'total_amount', 'total_cost']
                        ):
                            data = parsed
                            break
                    except:
                        pass
            
            print(f"\n{'='*70}")
            print(f"[SIMPLE AGENT] Completed")
            print(f"{'='*70}\n")
            
            return {
                "answer": answer,
                "data": data,
                "source": "simple_agent",
                "queries_executed": self.queries_executed
            }
        
        except Exception as e:
            print(f"\n[SIMPLE AGENT ERROR] {str(e)}\n")
            import traceback
            traceback.print_exc()
            return {
                "answer": f"Error: {str(e)}",
                "data": None,
                "source": "simple_agent",
                "queries_executed": self.queries_executed
            }



