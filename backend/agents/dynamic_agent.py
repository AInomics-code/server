from langchain_aws import ChatBedrock
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from config import get_settings
from prompts import load_prompt_with_date
from typing import Dict, Any

settings = get_settings()

class DynamicAgent:
    def __init__(self):
        self.llm = self._initialize_llm()
        self.tools = []
        self.queries_executed = []
        self._load_tools()
        self.agent = create_react_agent(self.llm, self.tools)
        self.system_prompt = self._get_system_prompt()
    
    def _initialize_llm(self):
        # Configure retry strategy with exponential backoff for throttling
        from botocore.config import Config
        retry_config = Config(
            retries={
                'max_attempts': 3,  # Reduce from default 4 to 3
                'mode': 'adaptive'  # Use adaptive retry mode for better throttling handling
            }
        )
        
        return ChatBedrock(
            model_id=settings.bedrock_model_id,
            region_name=settings.aws_region,
            credentials_profile_name=None,
            provider="anthropic",
            config=retry_config,  # Add retry configuration
            model_kwargs={"temperature": 0.3, "max_tokens": 2000}
        )
    
    def _get_system_prompt(self) -> str:
        return load_prompt_with_date("dynamic_agent.txt")
    
    def _load_tools(self):
        from agents.tools.sql_tool import create_sql_tool
        from agents.tools.vector_tool import create_vector_tool
        from agents.tools.date_tool import get_current_date
        from agents.tools.simple_sql_tools import (
            create_inventory_tool,
            create_sales_tool,
            create_backorders_tool,
            create_inventory_summary_tool,
            create_sales_summary_tool,
            create_sales_by_month_tool,
            create_sales_by_product_tool,
            create_backorders_summary_tool,
            create_product_search_tool
        )
        from agents.tools.advanced_sql_tools import (
            create_client_sales_analysis_tool,
            create_budget_vs_actual_tool,
            create_product_performance_tool,
            create_slow_moving_products_tool,
            create_location_performance_tool,
            create_inventory_distribution_tool,
            create_seller_performance_tool,
            create_monthly_trend_tool,
            create_order_fulfillment_rate_tool
        )
        
        # Basic summary tools
        self.tools.append(create_backorders_summary_tool(self.queries_executed))
        self.tools.append(create_sales_summary_tool(self.queries_executed))
        self.tools.append(create_sales_by_month_tool(self.queries_executed))
        self.tools.append(create_sales_by_product_tool(self.queries_executed))
        self.tools.append(create_inventory_summary_tool(self.queries_executed))
        
        # Basic detail tools
        self.tools.append(create_inventory_tool(self.queries_executed))
        self.tools.append(create_sales_tool(self.queries_executed))
        self.tools.append(create_backorders_tool(self.queries_executed))
        self.tools.append(create_product_search_tool(self.queries_executed))
        
        # Advanced analytical tools
        self.tools.append(create_client_sales_analysis_tool(self.queries_executed))
        self.tools.append(create_budget_vs_actual_tool(self.queries_executed))
        self.tools.append(create_product_performance_tool(self.queries_executed))
        self.tools.append(create_slow_moving_products_tool(self.queries_executed))
        self.tools.append(create_location_performance_tool(self.queries_executed))
        self.tools.append(create_inventory_distribution_tool(self.queries_executed))
        self.tools.append(create_seller_performance_tool(self.queries_executed))
        self.tools.append(create_monthly_trend_tool(self.queries_executed))
        self.tools.append(create_order_fulfillment_rate_tool(self.queries_executed))
        
        # Dynamic SQL and vector search
        self.tools.append(create_sql_tool(self.queries_executed))
        self.tools.append(create_vector_tool(self.queries_executed))
        self.tools.append(get_current_date)
    
    async def execute(self, query: str, session_id: str, user_id: str) -> Dict[str, Any]:
        self.queries_executed = []
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=query)
        ]
        
        config = {
            "configurable": {"thread_id": session_id},
            "recursion_limit": 15,
            "metadata": {
                "conversation_id": session_id,
                "user_id": user_id,
                "agent_type": "dynamic",
                "model": "sonnet"
            },
            "tags": [
                settings.environment if hasattr(settings, 'environment') else "development",
                "dynamic_agent",
                "sonnet"
            ]
        }
        
        print(f"\n{'='*70}")
        print(f"[DYNAMIC AGENT] Query: {query}")
        print(f"{'='*70}\n")
        print("\n> Entering new AgentExecutor chain...\n")
        
        try:
            result = await self.agent.ainvoke({"messages": messages}, config=config)
            final_messages = result.get("messages", [])
            
            # Collect tool observations and final answer
            tool_observations = []
            answer = ""
            data = None
            
            for msg in final_messages[2:]:  # Skip system and user messages
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    for tool_call in msg.tool_calls:
                        print(f"\nInvoking: `{tool_call['name']}` with `{tool_call['args']}`")
                elif hasattr(msg, 'content') and isinstance(msg.content, str):
                    if msg.type == 'tool':
                        print(f"\n{msg.content}\n")
                        # Collect tool observations (formatted data from tools)
                        try:
                            import json
                            parsed = json.loads(msg.content)
                            if isinstance(parsed, dict) and any(
                                k in parsed for k in ['total_quantity', 'total_value_usd', 'total_amount', 'total_cost']
                            ):
                                data = parsed
                        except:
                            # If not JSON, it's formatted text - add to observations
                            tool_observations.append(msg.content)
                    elif msg.type == 'ai' and msg.content:
                        print(f"{msg.content}\n")
                        # This is the final AI response
                        answer = msg.content
            
            # Build complete answer: tool observations + agent's final comment
            if tool_observations:
                complete_answer = "\n\n".join(tool_observations)
                if answer and answer.strip():
                    complete_answer += "\n\n" + answer
                answer = complete_answer
            elif not answer:
                answer = "No pude procesar tu consulta."
            
            print("\n> Finished chain.\n")
            print(f"{'='*70}")
            print(f"[DYNAMIC AGENT] Completed - {len(self.queries_executed)} tools used")
            print(f"{'='*70}\n")
            
            return {
                "answer": answer,
                "data": data,
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

