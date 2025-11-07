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
        return ChatBedrock(
            model_id=settings.classifier_model_id,
            region_name=settings.aws_region,
            credentials_profile_name=None,
            provider="anthropic",
            model_kwargs={
                "temperature": 0,
                "max_tokens": 1500,
                "system": system_prompt  # Set system prompt in model kwargs
            }
        )
    
    def _load_tools(self):
        from agents.tools.simple_sql_tools import (
            create_inventory_tool,
            create_sales_tool,
            create_backorders_tool,
            create_product_search_tool,
            create_inventory_summary_tool,
            create_sales_summary_tool,
            create_backorders_summary_tool
        )
        
        # Simple/fast tools only - for quick lookups
        self.tools.append(create_product_search_tool(self.queries_executed))
        self.tools.append(create_inventory_summary_tool(self.queries_executed))
        self.tools.append(create_sales_summary_tool(self.queries_executed))
        self.tools.append(create_backorders_summary_tool(self.queries_executed))
        self.tools.append(create_inventory_tool(self.queries_executed))
        self.tools.append(create_sales_tool(self.queries_executed))
        self.tools.append(create_backorders_tool(self.queries_executed))
    
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
