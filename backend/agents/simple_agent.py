from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from config import get_settings
from prompts import load_prompt_with_date
from typing import Dict, Any, List

settings = get_settings()


class SimpleAgent:
    def __init__(self):
        self.llm = self._initialize_llm()
        self.tools = []
        self.queries_executed = []
        self._load_tools()
        self.agent = create_react_agent(self.llm, self.tools)
        self.system_prompt = self._get_system_prompt()
    
    def _get_system_prompt(self) -> str:
        return load_prompt_with_date("simple_agent.txt")
    
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
        
        # Use ChatBedrockConverse (Converse API) instead of ChatBedrock
        # CRITICAL: ChatBedrock generates XML format for Claude 4+ which doesn't work with langgraph
        # ChatBedrockConverse uses Converse API with native tool calling support
        return ChatBedrockConverse(
            model=settings.classifier_model_id,
            client=bedrock_client,
            temperature=0,
            max_tokens=3000  # Increased for complex responses
        )
    
    def _load_tools(self):
        from agents.tools.simple_sql_tools import (
            create_inventory_tool,
            create_sales_tool,
            create_backorders_tool,
            create_product_search_tool,
            create_location_search_tool,
            create_client_search_tool,
            create_client_group_search_tool,
            create_inventory_summary_tool,
            create_sales_summary_tool,
            create_sales_by_month_tool,
            create_sales_by_product_tool,
            create_sales_by_client_tool,
            create_backorders_summary_tool,
            create_backorders_by_month_tool,
            create_budgets_summary_tool,
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
        
        # Simple/fast tools only - for quick lookups
        self.tools.append(create_product_search_tool(self.queries_executed))
        self.tools.append(create_location_search_tool(self.queries_executed))
        self.tools.append(create_client_search_tool(self.queries_executed))
        self.tools.append(create_client_group_search_tool(self.queries_executed))
        self.tools.append(create_inventory_summary_tool(self.queries_executed))
        self.tools.append(create_sales_summary_tool(self.queries_executed))
        self.tools.append(create_sales_by_month_tool(self.queries_executed))
        self.tools.append(create_sales_by_product_tool(self.queries_executed))
        self.tools.append(create_sales_by_client_tool(self.queries_executed))
        self.tools.append(create_backorders_summary_tool(self.queries_executed))
        self.tools.append(create_backorders_by_month_tool(self.queries_executed))
        self.tools.append(create_budgets_summary_tool(self.queries_executed))
        self.tools.append(create_inventory_tool(self.queries_executed))
        self.tools.append(create_sales_tool(self.queries_executed))
        self.tools.append(create_backorders_tool(self.queries_executed))
        
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
    
    async def execute(self, query: str, session_id: str, user_id: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        self.queries_executed = []
        
        # Build messages with conversation history
        messages = [SystemMessage(content=self.system_prompt)]
        
        # Add conversation history if available
        if conversation_history:
            # Take last 4 messages: 2 user + 2 assistant (most recent context only)
            # Filter by role and take last 2 of each
            user_messages = [msg for msg in conversation_history if msg.get("role") == "user"][-2:]
            assistant_messages = [msg for msg in conversation_history if msg.get("role") == "assistant"][-2:]
            
            # Merge and sort by original order (maintain conversation flow)
            recent_messages = sorted(
                user_messages + assistant_messages,
                key=lambda m: conversation_history.index(m)
            )
            
            for msg in recent_messages:
                if msg.get("role") == "user":
                    messages.append(HumanMessage(content=msg.get("content", "")))
                elif msg.get("role") == "assistant":
                    # For assistant messages, extract the text content
                    content = msg.get("content", "")
                    # If content is a list of components, extract text
                    if isinstance(content, list):
                        text_parts = []
                        for comp in content:
                            if isinstance(comp, dict) and comp.get("type") == "text":
                                text_parts.append(comp.get("data", ""))
                        content = "\n".join(text_parts) if text_parts else ""
                    if content:
                        messages.append(AIMessage(content=content))
        
        # Add current query
        messages.append(HumanMessage(content=query))
        
        config = {
            "configurable": {"thread_id": session_id},
            "recursion_limit": 10,
            "metadata": {
                "conversation_id": session_id,
                "user_id": user_id,
                "agent_type": "simple",
                "model": "haiku",
                "history_length": len(conversation_history) if conversation_history else 0
            },
            "tags": [
                settings.environment if hasattr(settings, 'environment') else "development",
                "simple_agent",
                "haiku"
            ]
        }
        
        print(f"\n{'='*70}")
        print(f"[SIMPLE AGENT] Query: {query}")
        print(f"[SIMPLE AGENT] History: {len(conversation_history) if conversation_history else 0} messages")
        print(f"{'='*70}\n")
        print("\n> Entering new AgentExecutor chain...\n")
        
        try:
            result = await self.agent.ainvoke({"messages": messages}, config=config)
            final_messages = result.get("messages", [])
            
            # Get the final AI response
            answer = ""
            
            # Skip initial messages (system + history + current user query)
            # Find where the agent's reasoning starts
            start_idx = len(messages)  # Start after all input messages
            
            for msg in final_messages[start_idx:]:
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
            print(f"[SIMPLE AGENT] Completed - {len(message_components)} components")
            print(f"{'='*70}\n")
            
            return {
                "answer": message_components,
                "source": "simple_agent"
            }
        
        except Exception as e:
            print(f"\n[SIMPLE AGENT ERROR] {str(e)}\n")
            import traceback
            traceback.print_exc()
            return {
                "answer": [{"type": "text", "data": f"Error: {str(e)}"}],
                "source": "simple_agent"
            }
    
    def _parse_structured_response(self, response: str) -> List[Dict]:
        """Parse and validate the structured JSON response from agent"""
        import json
        import re
        
        if not response or not response.strip():
            return [{"type": "text", "data": "No se pudo procesar la consulta."}]
        
        # Remove XML tool call blocks (legacy format from Claude)
        response = re.sub(r'<function_calls>.*?</function_calls>', '', response, flags=re.DOTALL)
        
        # Remove markdown code blocks if present
        response = re.sub(r'^```json\s*', '', response)
        response = re.sub(r'^```\s*', '', response)
        response = re.sub(r'\s*```$', '', response)
        
        # Clean up extra whitespace after removing XML
        response = response.strip()
        
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
        
        except json.JSONDecodeError as e:
            # JSON is malformed or incomplete
            print(f"[ERROR] JSON parsing failed: {str(e)}")
            print(f"[ERROR] Response preview: {response[:500]}...")
            
            # If response looks like it was truncated (missing closing brackets)
            if response.count('[') > response.count(']') or response.count('{') > response.count('}'):
                error_msg = "⚠️ La respuesta fue truncada. Por favor intenta de nuevo o simplifica tu consulta."
                return [{"type": "text", "data": error_msg}]
            
            # Fallback to text component
            return [{"type": "text", "data": response}]
