from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from config import get_settings
from prompts import load_prompt_with_date
from typing import Dict, Any, List
import json

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
        
        # Use ChatBedrockConverse (Converse API) instead of ChatBedrock
        # CRITICAL: ChatBedrock generates XML format for Claude 4+ which doesn't work with langgraph
        # ChatBedrockConverse uses Converse API with native tool calling support
        return ChatBedrockConverse(
            model=settings.bedrock_model_id,
            client=bedrock_client,
            temperature=0.3,
            max_tokens=4000  # Increased for complex reports like sales health
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
            create_commercial_goals_by_month_tool,
            create_sales_health_tool,
            create_inventory_health_tool
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
        
        # Health monitoring tools - NEW
        self.tools.append(create_sales_health_tool(self.queries_executed))
        self.tools.append(create_inventory_health_tool(self.queries_executed))
        
        # Dynamic SQL and vector search
        self.tools.append(create_sql_tool(self.queries_executed))
        self.tools.append(create_vector_tool(self.queries_executed))
        self.tools.append(get_current_date)
    
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
                    from langchain_core.messages import AIMessage
                    if content:
                        messages.append(AIMessage(content=content))
        
        # Add current query
        messages.append(HumanMessage(content=query))
        
        config = {
            "configurable": {"thread_id": session_id},
            "recursion_limit": 15,
            "metadata": {
                "conversation_id": session_id,
                "user_id": user_id,
                "agent_type": "dynamic",
                "model": "sonnet",
                "history_length": len(conversation_history) if conversation_history else 0
            },
            "tags": [
                settings.environment if hasattr(settings, 'environment') else "development",
                "dynamic_agent",
                "sonnet"
            ]
        }
        
        print(f"\n{'='*70}")
        print(f"[DYNAMIC AGENT] Query: {query}")
        print(f"[DYNAMIC AGENT] History: {len(conversation_history) if conversation_history else 0} messages")
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
            
            # Track files from tool responses
            extracted_files = []
            
            for msg in final_messages[start_idx:]:
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    for tool_call in msg.tool_calls:
                        print(f"\nInvoking: `{tool_call['name']}` with `{tool_call['args']}`")
                elif hasattr(msg, 'content') and isinstance(msg.content, str):
                    if msg.type == 'tool':
                        # Check if tool response contains structured data to extract
                        try:
                            tool_response = json.loads(msg.content)
                            if isinstance(tool_response, dict):
                                # Extract file info
                                if 'file' in tool_response:
                                    file_info = tool_response['file']
                                    if file_info.get('url') and file_info.get('filename'):
                                        extracted_files.append({
                                            "type": "file",
                                            "data": {
                                                "url": file_info['url'],
                                                "filename": file_info['filename']
                                            }
                                        })
                                        print(f"[FILE EXTRACTED] {file_info['filename']}")

                                # Extract inventory health structured data
                                if 'summary' in tool_response and 'risk_distribution' in tool_response:
                                    extracted_files.append({
                                        "type": "inventory_report_data",
                                        "data": {
                                            "period": tool_response.get("period"),
                                            "summary": tool_response.get("summary", {}),
                                            "risk_distribution": tool_response.get("risk_distribution", {}),
                                            "rotation_alerts": tool_response.get("rotation_alerts", {}),
                                            "top_products_by_sales": tool_response.get("top_products_by_sales", []),
                                            "critical_products": tool_response.get("critical_products", []),
                                            "low_rotation_products": tool_response.get("low_rotation_products", []),
                                        }
                                    })
                                    print(f"[INVENTORY DATA EXTRACTED] period={tool_response.get('period')}")

                                # Extract sales health structured data
                                if 'summary' in tool_response and 'seller_performance' in tool_response:
                                    extracted_files.append({
                                        "type": "sales_report_data",
                                        "data": {
                                            "period": tool_response.get("period"),
                                            "summary": tool_response.get("summary", {}),
                                            "seller_performance": tool_response.get("seller_performance", []),
                                            "top_clients": tool_response.get("top_clients", []),
                                            "product_performance": tool_response.get("product_performance", []),
                                        }
                                    })
                                    print(f"[SALES DATA EXTRACTED] period={tool_response.get('period')}")

                        except (json.JSONDecodeError, TypeError):
                            pass
                        print(f"\n{msg.content}\n")
                    elif msg.type == 'ai' and msg.content:
                        print(f"{msg.content}\n")
                        # This is the final AI response
                        answer = msg.content
            
            if not answer:
                answer = "No pude procesar tu consulta."
            
            # Parse and validate structured response
            message_components = self._parse_structured_response(answer)
            
            # Add extracted files as separate components at the end
            if extracted_files:
                message_components.extend(extracted_files)
                print(f"[FILES] Added {len(extracted_files)} file(s) to response")
            
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
        """Parse the agent response. Handles both JSON-array format and plain markdown."""
        import json
        import re
        
        if not response or not response.strip():
            return [{"type": "text", "data": "I could not process the query."}]
        
        # Remove markdown code fences if present
        cleaned = re.sub(r'^```json\s*', '', response.strip())
        cleaned = re.sub(r'^```\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned).strip()

        valid_types = {
            "text", "area_chart", "bar_chart", "bubble_chart",
            "pie_chart", "line_chart", "polar_chart", "mixed_chart",
            "radar_chart", "scatter_chart", "file"
        }

        # ------------------------------------------------------------------
        # Try to parse as a JSON array (used for chart-rich responses)
        # ------------------------------------------------------------------
        json_match = re.search(r'\[.*\]', cleaned, re.DOTALL)
        if json_match:
            candidate = json_match.group(0)
            try:
                components = json.loads(candidate)
                if isinstance(components, list):
                    validated = [
                        c for c in components
                        if isinstance(c, dict)
                        and c.get("type") in valid_types
                        and "data" in c
                    ]
                    if validated:
                        return validated
            except json.JSONDecodeError:
                pass  # Fall through to markdown handling

        # ------------------------------------------------------------------
        # Treat the entire response as markdown text (new health format and
        # any other non-JSON response)
        # ------------------------------------------------------------------
        return [{"type": "text", "data": cleaned}]

