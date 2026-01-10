from langchain_aws import ChatBedrock
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
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
        
        # Create prompt without system message in template
        # We'll add system message separately to avoid Bedrock issues
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        
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
        # Add system prompt to model configuration instead of chat template
        system_prompt = load_prompt_with_date("simple_agent.txt")
        
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
            model_id=settings.classifier_model_id,
            client=bedrock_client,  # Pass explicit client
            model_kwargs={
                "temperature": 0,
                "max_tokens": 1500,
                "anthropic_version": "bedrock-2023-05-31",  # Add explicit version
                "system": system_prompt  # Set system prompt in model kwargs
            }
        )
    
    def _load_tools(self):
        from agents.tools.simple_sql_tools import (
            create_inventory_tool,
            create_sales_tool,
            create_backorders_tool,
            create_product_search_tool,
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
        
        print(f"\n{'='*70}")
        print(f"[SIMPLE AGENT] Query: {query}")
        print(f"[SIMPLE AGENT] History: {len(conversation_history) if conversation_history else 0} messages")
        print(f"{'='*70}\n")
        
        chat_history = []
        if conversation_history:
            # Take last 10 messages and ensure they alternate user/assistant properly
            recent_messages = conversation_history[-10:]
            for msg in recent_messages:
                if msg.get("role") == "user":
                    chat_history.append(HumanMessage(content=msg.get("content", "")))
                elif msg.get("role") == "assistant":
                    chat_history.append(AIMessage(content=msg.get("content", "")))
            
            # AWS Bedrock requires first message to be user role
            # If chat_history starts with assistant message, remove it
            if chat_history and isinstance(chat_history[0], AIMessage):
                chat_history = chat_history[1:]
        
        config = RunnableConfig(
            metadata={
                "conversation_id": session_id,
                "user_id": user_id,
                "agent_type": "simple",
                "model": "haiku",
                "history_length": len(chat_history)
            },
            tags=[
                settings.environment if hasattr(settings, 'environment') else "development",
                "simple_agent",
                "haiku"
            ]
        )
        
        try:
            result = await self.agent_executor.ainvoke(
                {"input": query, "chat_history": chat_history},
                config=config
            )
            
            output = result.get("output", "No pude procesar tu consulta.")
            
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
            
            # Collect tool observations (formatted data from tools)
            tool_observations = []
            data = None
            intermediate_steps = result.get("intermediate_steps", [])
            for action, observation in intermediate_steps:
                if isinstance(observation, str):
                    # Try to parse as JSON for data field
                    try:
                        import json
                        parsed = json.loads(observation)
                        # Check if it's structured data (has common data keys)
                        if isinstance(parsed, dict) and any(
                            k in parsed for k in ['total_quantity', 'total_value_usd', 'total_amount', 'total_cost', 'results', 'items', 'data', 'candidates', 'total_candidates', 'products', 'clients', 'groups', 'months']
                        ):
                            data = parsed
                    except:
                        # If not JSON, it's formatted text - add to observations
                        tool_observations.append(observation)
            
            # Build complete answer: tool observations + agent's final comment
            complete_answer = ""
            if tool_observations:
                complete_answer = "\n\n".join(tool_observations)
                if answer and answer.strip():
                    complete_answer += "\n\n" + answer
            else:
                complete_answer = answer
            
            answer = complete_answer
            
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
