from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Any
from core.router import QueryRouter
from core.executor import QueryExecutor
from memory.redis_memory import RedisMemory
from auth.dependencies import get_current_user
from models.user import UserResponse
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
    
    user_id = str(current_user.user_id)
    session_id = request.session_id or f"{user_id}_{int(time.time())}"
    
    # Get conversation history BEFORE adding new message
    history = await memory.get_messages(session_id)
    
    await memory.add_message(session_id, "user", request.query)
    
    # Pass history to router for contextual classification
    query_type = await query_router.classify(request.query, history)
    
    result = await executor.execute(
        query=request.query,
        query_type=query_type,
        session_id=session_id,
        user_id=user_id
    )
    
    await memory.add_message(session_id, "assistant", json.dumps(result["message"]))
    
    latency = (time.time() - start) * 1000
    
    return QueryResponse(
        message=result["message"],
        metadata={
            "session_id": session_id,
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
        
        user_id = str(current_user.user_id)
        session_id = request.session_id or f"{user_id}_{int(time.time())}"
        
        # Get conversation history BEFORE adding new message
        history = await memory.get_messages(session_id)
        
        await memory.add_message(session_id, "user", request.query)
        
        yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing query...'})}\n\n"
        
        # Pass history to router for contextual classification
        query_type = await query_router.classify(request.query, history)
        
        yield f"data: {json.dumps({'type': 'status', 'message': f'Using {query_type.value} method'})}\n\n"
        
        async for chunk in executor.execute_stream(
            query=request.query,
            query_type=query_type,
            session_id=session_id,
            user_id=user_id
        ):
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            await asyncio.sleep(0.01)
        
        latency = (time.time() - start) * 1000
        yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency, 'session_id': session_id})}\n\n"
    
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

