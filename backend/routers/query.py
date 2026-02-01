from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Any
from uuid import UUID
from core.router import QueryRouter
from core.executor import QueryExecutor
from memory.redis_memory import RedisMemory
from auth.dependencies import get_current_user
from models.user import UserResponse
from services import conversation_service
import json
import asyncio

router = APIRouter()

query_router = QueryRouter()
executor = QueryExecutor()
memory = RedisMemory()

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    message: List[dict]  # Array of component objects
    metadata: dict

@router.post("/query", response_model=QueryResponse)
async def query_endpoint(
    request: QueryRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    import time
    start = time.time()
    
    user_id = current_user.user_id
    
    # ========================================================================
    # STEP 1: Get or create conversation in PostgreSQL
    # ========================================================================
    if request.session_id:
        # Existing conversation - verify ownership
        conversation = await conversation_service.get_conversation(
            UUID(request.session_id), user_id
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation_id = str(conversation["conversation_id"])
    else:
        # New conversation - create in PostgreSQL
        conversation = await conversation_service.create_conversation(
            user_id=user_id,
            first_query=request.query
        )
        conversation_id = str(conversation["conversation_id"])
    
    # ========================================================================
    # STEP 2: Check Redis cache, reload from PostgreSQL if empty
    # ========================================================================
    history = await memory.get_messages(conversation_id)
    
    if not history or len(history) == 0:
        # Redis cache miss - reload last 4 messages from PostgreSQL
        print(f"♻️ Redis cache miss - reloading from PostgreSQL for conversation {conversation_id}")
        
        db_messages = await conversation_service.get_recent_messages_for_context(
            UUID(conversation_id),
            user_limit=2,
            assistant_limit=2
        )
        
        # Sync to Redis
        for msg in db_messages:
            role = msg["role"]
            content = msg["content"]
            
            # Format content for Redis
            if role == "user":
                content_str = content.get("text", "") if isinstance(content, dict) else str(content)
            else:
                content_str = json.dumps(content) if isinstance(content, dict) else str(content)
            
            await memory.add_message(conversation_id, role, content_str)
        
        # Reload history from Redis
        history = await memory.get_messages(conversation_id)
        print(f"✅ Synced {len(db_messages)} messages to Redis")
    
    # ========================================================================
    # STEP 3: Save user message to both PostgreSQL and Redis
    # ========================================================================
    await conversation_service.add_message(
        conversation_id=UUID(conversation_id),
        role="user",
        content={"text": request.query}
    )
    
    await memory.add_message(conversation_id, "user", request.query)
    
    # ========================================================================
    # STEP 4: Execute query with agent (reads from Redis)
    # ========================================================================
    query_type = await query_router.classify(request.query, history)
    
    result = await executor.execute(
        query=request.query,
        query_type=query_type,
        session_id=conversation_id,
        user_id=str(user_id)
    )
    
    # ========================================================================
    # STEP 5: Save assistant response to both PostgreSQL and Redis
    # ========================================================================
    await conversation_service.add_message(
        conversation_id=UUID(conversation_id),
        role="assistant",
        content=result["message"],
        metadata={
            "query_type": query_type.value,
            "type": result.get("type", "direct")
        }
    )
    
    await memory.add_message(conversation_id, "assistant", json.dumps(result["message"]))
    
    latency = (time.time() - start) * 1000
    
    return QueryResponse(
        message=result["message"],
        metadata={
            "conversation_id": conversation_id,  # Return conversation_id instead of session_id
            "query_type": query_type.value,
            "latency_ms": round(latency, 2),
            "type": result.get("type", "direct")
        }
    )

@router.post("/query/stream")
async def query_stream_endpoint(
    request: QueryRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    async def event_generator():
        import time
        start = time.time()
        
        user_id = current_user.user_id
        
        # Get or create conversation
        if request.session_id:
            conversation = await conversation_service.get_conversation(
                UUID(request.session_id), user_id
            )
            if not conversation:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Conversation not found'})}\n\n"
                return
            conversation_id = str(conversation["conversation_id"])
        else:
            conversation = await conversation_service.create_conversation(
                user_id=user_id,
                first_query=request.query
            )
            conversation_id = str(conversation["conversation_id"])
        
        # Check Redis cache, reload if empty
        history = await memory.get_messages(conversation_id)
        
        if not history or len(history) == 0:
            db_messages = await conversation_service.get_recent_messages_for_context(
                UUID(conversation_id),
                user_limit=2,
                assistant_limit=2
            )
            
            for msg in db_messages:
                role = msg["role"]
                content = msg["content"]
                content_str = content.get("text", "") if role == "user" and isinstance(content, dict) else json.dumps(content)
                await memory.add_message(conversation_id, role, content_str)
            
            history = await memory.get_messages(conversation_id)
        
        # Save user message
        await conversation_service.add_message(
            conversation_id=UUID(conversation_id),
            role="user",
            content={"text": request.query}
        )
        
        await memory.add_message(conversation_id, "user", request.query)
        
        yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing query...'})}\n\n"
        
        # Pass history to router for contextual classification
        query_type = await query_router.classify(request.query, history)
        
        yield f"data: {json.dumps({'type': 'status', 'message': f'Using {query_type.value} method'})}\n\n"
        
        async for chunk in executor.execute_stream(
            query=request.query,
            query_type=query_type,
            session_id=conversation_id,
            user_id=str(user_id)
        ):
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            await asyncio.sleep(0.01)
        
        latency = (time.time() - start) * 1000
        
        # Note: For streaming, we don't save the assistant response here
        # as it's already being streamed. You might want to collect chunks
        # and save after streaming completes if needed.
        
        yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency, 'conversation_id': conversation_id})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    messages = await memory.get_messages(session_id)
    return {"session_id": session_id, "messages": messages}

@router.delete("/session/{session_id}")
async def clear_session(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    await memory.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}

@router.post("/admin/clear-cache")
async def clear_router_cache(
    current_user: UserResponse = Depends(get_current_user)
):
    """Clear the query classification cache (admin endpoint)"""
    query_router.clear_cache()
    return {"message": "Router cache cleared successfully"}

