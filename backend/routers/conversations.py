"""
API endpoints for conversation management.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from auth.dependencies import get_current_user
from models.user import UserResponse
from services import conversation_service

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class UpdateConversationRequest(BaseModel):
    title: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/conversations")
async def list_conversations(
    limit: int = 50,
    offset: int = 0,
    archived: bool = False,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    List user's conversations ordered by most recent activity.
    
    Query params:
    - limit: Maximum number of conversations to return (default: 50)
    - offset: Number of conversations to skip for pagination (default: 0)
    - archived: Include archived conversations (default: false)
    
    Returns:
    - List of conversations with metadata and message counts
    """
    conversations = await conversation_service.list_conversations(
        user_id=current_user.user_id,
        limit=limit,
        offset=offset,
        archived=archived
    )
    
    return {
        "conversations": conversations,
        "total": len(conversations),
        "limit": limit,
        "offset": offset
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(
    conversation_id: UUID,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get conversation details with all messages.
    
    Path params:
    - conversation_id: UUID of the conversation
    
    Returns:
    - Conversation metadata
    - All messages in the conversation
    """
    # Verify ownership
    conversation = await conversation_service.get_conversation(
        conversation_id, current_user.user_id
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all messages
    messages = await conversation_service.get_messages(conversation_id)
    
    return {
        "conversation": conversation,
        "messages": messages,
        "message_count": len(messages)
    }


@router.put("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: UUID,
    request: UpdateConversationRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update conversation title.
    
    Path params:
    - conversation_id: UUID of the conversation
    
    Body:
    - title: New title for the conversation
    
    Returns:
    - Success status
    """
    success = await conversation_service.update_conversation_title(
        conversation_id, current_user.user_id, request.title
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"status": "updated", "conversation_id": str(conversation_id)}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    permanent: bool = False,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete a conversation.
    
    Path params:
    - conversation_id: UUID of the conversation
    
    Query params:
    - permanent: If true, permanently delete. If false (default), archive (soft delete)
    
    Returns:
    - Success status
    """
    if permanent:
        # Permanent deletion
        success = await conversation_service.delete_conversation(
            conversation_id, current_user.user_id
        )
        status = "deleted"
    else:
        # Soft delete (archive)
        success = await conversation_service.archive_conversation(
            conversation_id, current_user.user_id
        )
        status = "archived"
    
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "status": status,
        "conversation_id": str(conversation_id),
        "permanent": permanent
    }


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: UUID,
    limit: Optional[int] = None,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get messages from a conversation with pagination.
    
    Path params:
    - conversation_id: UUID of the conversation
    
    Query params:
    - limit: Maximum number of messages to return (default: all)
    - offset: Number of messages to skip (default: 0)
    
    Returns:
    - List of messages
    """
    # Verify ownership
    conversation = await conversation_service.get_conversation(
        conversation_id, current_user.user_id
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await conversation_service.get_messages(
        conversation_id, limit=limit, offset=offset
    )
    
    return {
        "conversation_id": str(conversation_id),
        "messages": messages,
        "count": len(messages)
    }
