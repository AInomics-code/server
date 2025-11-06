from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from core.router import QueryRouter
from core.executor import QueryExecutor
from memory.redis_memory import RedisMemory
import json
import asyncio

router = APIRouter()

query_router = QueryRouter()
executor = QueryExecutor()
memory = RedisMemory()

class QueryRequest(BaseModel):
    query: str
    user_id: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    message: str
    data: Optional[dict] = None
    queries_executed: Optional[list] = None
    metadata: dict

@router.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    import time
    start = time.time()
    
    session_id = request.session_id or f"{request.user_id}_{int(time.time())}"
    
    # Get conversation history BEFORE adding new message
    history = await memory.get_messages(session_id)
    
    await memory.add_message(session_id, "user", request.query)
    
    # Pass history to router for contextual classification
    query_type = await query_router.classify(request.query, history)
    
    result = await executor.execute(
        query=request.query,
        query_type=query_type,
        session_id=session_id,
        user_id=request.user_id
    )
    
    await memory.add_message(session_id, "assistant", result["message"])
    
    latency = (time.time() - start) * 1000
    
    return QueryResponse(
        message=result["message"],
        data=result.get("data"),
        queries_executed=result.get("queries_executed", []),
        metadata={
            "session_id": session_id,
            "query_type": query_type.value,
            "latency_ms": round(latency, 2),
            "type": result.get("type", "direct")
        }
    )

@router.post("/query/stream")
async def query_stream_endpoint(request: QueryRequest):
    async def event_generator():
        import time
        start = time.time()
        
        session_id = request.session_id or f"{request.user_id}_{int(time.time())}"
        
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
            user_id=request.user_id
        ):
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            await asyncio.sleep(0.01)
        
        latency = (time.time() - start) * 1000
        yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency, 'session_id': session_id})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    messages = await memory.get_messages(session_id)
    return {"session_id": session_id, "messages": messages}

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    await memory.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}

@router.post("/admin/clear-cache")
async def clear_router_cache():
    """Clear the query classification cache (admin endpoint)"""
    query_router.clear_cache()
    return {"message": "Router cache cleared successfully"}

