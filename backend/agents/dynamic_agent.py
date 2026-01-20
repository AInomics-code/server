from langchain_aws import ChatBedrock
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from config import get_settings
from prompts import load_prompt_with_date
from typing import Dict, Any, List

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
        
        # Use explicit boto3 client to avoid LangChain issues
        import boto3
        bedrock_client = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            config=retry_config
        )
        
        return ChatBedrock(
            model_id=settings.bedrock_model_id,
            client=bedrock_client,  # Pass explicit client
            model_kwargs={
                "temperature": 0.3,
                "max_tokens": 2000,
                "anthropic_version": "bedrock-2023-05-31"  # Add explicit version
            }
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
            create_sales_by_client_tool,
            create_backorders_summary_tool,
            create_backorders_by_month_tool,
            create_product_search_tool,
            create_location_search_tool,
            create_client_search_tool,
            create_client_group_search_tool,
            create_product_first_sale_tool,
            create_inactive_clients_tool,
            create_product_growth_analysis_tool,
            create_sales_comparison_tool,
            create_discontinuation_candidates_tool,
            create_budget_performance_tool,
            create_products_not_sold_tool,
            create_product_period_comparison_tool,
            create_client_performance_analysis_tool,
            create_commercial_goals_performance_tool,
            create_commercial_goals_by_month_tool
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
        self.tools.append(create_backorders_by_month_tool(self.queries_executed))
        self.tools.append(create_sales_summary_tool(self.queries_executed))
        self.tools.append(create_sales_by_month_tool(self.queries_executed))
        self.tools.append(create_sales_by_product_tool(self.queries_executed))
        self.tools.append(create_sales_by_client_tool(self.queries_executed))
        self.tools.append(create_inventory_summary_tool(self.queries_executed))
        
        # Basic detail tools
        self.tools.append(create_inventory_tool(self.queries_executed))
        self.tools.append(create_sales_tool(self.queries_executed))
        self.tools.append(create_backorders_tool(self.queries_executed))
        self.tools.append(create_product_search_tool(self.queries_executed))
        self.tools.append(create_location_search_tool(self.queries_executed))
        self.tools.append(create_client_search_tool(self.queries_executed))
        self.tools.append(create_client_group_search_tool(self.queries_executed))
        
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
        
        # Growth analysis tools - NEW
        self.tools.append(create_product_first_sale_tool(self.queries_executed))
        self.tools.append(create_inactive_clients_tool(self.queries_executed))
        self.tools.append(create_product_growth_analysis_tool(self.queries_executed))
        self.tools.append(create_sales_comparison_tool(self.queries_executed))
        self.tools.append(create_discontinuation_candidates_tool(self.queries_executed))
        self.tools.append(create_budget_performance_tool(self.queries_executed))
        self.tools.append(create_products_not_sold_tool(self.queries_executed))
        self.tools.append(create_product_period_comparison_tool(self.queries_executed))
        self.tools.append(create_client_performance_analysis_tool(self.queries_executed))
        
        # Commercial goals analysis tools - NEW
        self.tools.append(create_commercial_goals_performance_tool(self.queries_executed))
        self.tools.append(create_commercial_goals_by_month_tool(self.queries_executed))
        
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
            
            # Get the final AI response
            answer = ""
            
            for msg in final_messages[2:]:  # Skip system and user messages
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    for tool_call in msg.tool_calls:
                        print(f"\nInvoking: `{tool_call['name']}` with `{tool_call['args']}`")
                elif hasattr(msg, 'content') and isinstance(msg.content, str):
                    if msg.type == 'tool':
                        print(f"\n{msg.content}\n")
                    elif msg.type == 'ai' and msg.content:
                        print(f"{msg.content}\n")
                        # This is the final AI response
                        answer = msg.content
            
            if not answer:
                answer = "No pude procesar tu consulta."
            
            # Parse and validate structured response
            message_components = self._parse_structured_response(answer)
            
            print("\n> Finished chain.\n")
            print(f"{'='*70}")
            print(f"[DYNAMIC AGENT] Completed - {len(message_components)} components")
            print(f"{'='*70}\n")
            
            return {
                "answer": message_components,
                "source": "dynamic"
            }
        
        except Exception as e:
            print(f"\n[DYNAMIC AGENT ERROR] {str(e)}\n")
            return {
                "answer": [{"type": "text", "data": f"Error ejecutando la consulta: {str(e)}"}],
                "source": "dynamic"
            }
    
    def _parse_structured_response(self, response: str) -> List[Dict]:
        """Parse and validate the structured JSON response from agent"""
        import json
        import re
        
        if not response or not response.strip():
            return [{"type": "text", "data": "No pude procesar la consulta."}]
        
        # Remove markdown code blocks if present
        response = re.sub(r'^```json\s*', '', response)
        response = re.sub(r'^```\s*', '', response)
        response = re.sub(r'\s*```$', '', response)
        
        # Try to extract JSON from response (in case there's extra text)
        # Look for array pattern [...]
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            response = json_match.group(0)
        
        try:
            components = json.loads(response)
            
            # Validate it's an array
            if not isinstance(components, list):
                return [{"type": "text", "data": str(components)}]
            
            # Validate each component
            valid_types = {
                "text", "area_chart", "bar_chart", "bubble_chart", 
                "pie_chart", "line_chart", "polar_chart", "mixed_chart", 
                "radar_chart", "scatter_chart"
            }
            
            validated_components = []
            for component in components:
                if not isinstance(component, dict):
                    continue
                
                comp_type = component.get("type")
                if comp_type not in valid_types:
                    continue
                
                if "data" not in component:
                    continue
                
                validated_components.append(component)
            
            if not validated_components:
                return [{"type": "text", "data": response}]
            
            return validated_components
        
        except json.JSONDecodeError:
            # Fallback to text component
            return [{"type": "text", "data": response}]

