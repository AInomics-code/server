"""
Conversation database service for managing persistent chat history.
"""
import asyncpg
from typing import Optional, List, Dict, Any
from uuid import UUID
from config import get_settings
import json

settings = get_settings()


async def get_db_connection():
    """Get PostgreSQL connection for conversations"""
    return await asyncpg.connect(
        host=settings.postgres_host,
        port=settings.postgres_port,
        database=settings.postgres_db,
        user=settings.postgres_user,
        password=settings.postgres_password,
    )


# ============================================================================
# CONVERSATIONS CRUD
# ============================================================================

async def create_conversation(user_id: UUID, first_query: str) -> Dict[str, Any]:
    """
    Create a new conversation with auto-generated title from first query.
    
    Args:
        user_id: UUID of the user creating the conversation
        first_query: First query text to use as title
        
    Returns:
        Dictionary with conversation data
    """
    conn = await get_db_connection()
    try:
        # Auto-generate title from first query (first 80 chars)
        title = first_query[:80] + "..." if len(first_query) > 80 else first_query
        
        result = await conn.fetchrow("""
            INSERT INTO conversations (user_id, title)
            VALUES ($1, $2)
            RETURNING conversation_id, user_id, title, created_at, updated_at, last_message_at, archived
        """, user_id, title)
        
        return dict(result)
    finally:
        await conn.close()


async def list_conversations(
    user_id: UUID, 
    limit: int = 50, 
    offset: int = 0,
    archived: bool = False
) -> List[Dict[str, Any]]:
    """
    List user's conversations, ordered by last message.
    
    Args:
        user_id: UUID of the user
        limit: Maximum number of conversations to return
        offset: Number of conversations to skip
        archived: Whether to include archived conversations
        
    Returns:
        List of conversation dictionaries with message counts
    """
    conn = await get_db_connection()
    try:
        results = await conn.fetch("""
            SELECT 
                c.conversation_id,
                c.title,
                c.created_at,
                c.updated_at,
                c.last_message_at,
                c.metadata,
                c.archived,
                COUNT(m.message_id) as message_count,
                MAX(CASE WHEN m.role = 'user' THEN m.content->>'text' END) as last_user_message
            FROM conversations c
            LEFT JOIN messages m ON c.conversation_id = m.conversation_id
            WHERE c.user_id = $1 AND c.archived = $4
            GROUP BY c.conversation_id
            ORDER BY c.last_message_at DESC
            LIMIT $2 OFFSET $3
        """, user_id, limit, offset, archived)
        
        return [dict(r) for r in results]
    finally:
        await conn.close()


async def get_conversation(conversation_id: UUID, user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Get a single conversation (verify ownership).
    
    Args:
        conversation_id: UUID of the conversation
        user_id: UUID of the user (for ownership verification)
        
    Returns:
        Dictionary with conversation data or None if not found
    """
    conn = await get_db_connection()
    try:
        result = await conn.fetchrow("""
            SELECT * FROM conversations
            WHERE conversation_id = $1 AND user_id = $2 AND archived = FALSE
        """, conversation_id, user_id)
        
        return dict(result) if result else None
    finally:
        await conn.close()


async def update_conversation_title(
    conversation_id: UUID, 
    user_id: UUID, 
    title: str
) -> bool:
    """
    Update conversation title.
    
    Args:
        conversation_id: UUID of the conversation
        user_id: UUID of the user (for ownership verification)
        title: New title
        
    Returns:
        True if updated, False if not found
    """
    conn = await get_db_connection()
    try:
        result = await conn.execute("""
            UPDATE conversations
            SET title = $1, updated_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $2 AND user_id = $3 AND archived = FALSE
        """, title, conversation_id, user_id)
        
        return result == "UPDATE 1"
    finally:
        await conn.close()


async def archive_conversation(conversation_id: UUID, user_id: UUID) -> bool:
    """
    Archive (soft delete) a conversation.
    
    Args:
        conversation_id: UUID of the conversation
        user_id: UUID of the user (for ownership verification)
        
    Returns:
        True if archived, False if not found
    """
    conn = await get_db_connection()
    try:
        result = await conn.execute("""
            UPDATE conversations
            SET archived = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $2 AND user_id = $3
        """, conversation_id, user_id)
        
        return result == "UPDATE 1"
    finally:
        await conn.close()


async def delete_conversation(conversation_id: UUID, user_id: UUID) -> bool:
    """
    Permanently delete a conversation and all its messages.
    
    Args:
        conversation_id: UUID of the conversation
        user_id: UUID of the user (for ownership verification)
        
    Returns:
        True if deleted, False if not found
    """
    conn = await get_db_connection()
    try:
        result = await conn.execute("""
            DELETE FROM conversations
            WHERE conversation_id = $1 AND user_id = $2
        """, conversation_id, user_id)
        
        return result == "DELETE 1"
    finally:
        await conn.close()


# ============================================================================
# MESSAGES CRUD
# ============================================================================

async def add_message(
    conversation_id: UUID, 
    role: str, 
    content: Any,
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Add a message to a conversation.
    
    Args:
        conversation_id: UUID of the conversation
        role: 'user' or 'assistant'
        content: Message content (will be converted to JSON)
        metadata: Optional metadata dictionary
        
    Returns:
        Dictionary with message data
    """
    conn = await get_db_connection()
    try:
        # Ensure content is in correct format
        if isinstance(content, str):
            content_json = {"text": content}
        elif isinstance(content, dict):
            content_json = content
        elif isinstance(content, list):
            content_json = {"components": content}
        else:
            content_json = {"data": str(content)}
        
        result = await conn.fetchrow("""
            INSERT INTO messages (conversation_id, role, content, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING message_id, conversation_id, role, content, metadata, created_at
        """, conversation_id, role, json.dumps(content_json), json.dumps(metadata or {}))
        
        # Update last_message_at in conversation
        await conn.execute("""
            UPDATE conversations
            SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1
        """, conversation_id)
        
        return dict(result)
    finally:
        await conn.close()


async def get_messages(
    conversation_id: UUID, 
    limit: Optional[int] = None,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Get messages from a conversation.
    
    Args:
        conversation_id: UUID of the conversation
        limit: Maximum number of messages to return (None = all)
        offset: Number of messages to skip
        
    Returns:
        List of message dictionaries ordered by creation time
    """
    conn = await get_db_connection()
    try:
        if limit is None:
            results = await conn.fetch("""
                SELECT * FROM messages
                WHERE conversation_id = $1
                ORDER BY created_at ASC
                OFFSET $2
            """, conversation_id, offset)
        else:
            results = await conn.fetch("""
                SELECT * FROM messages
                WHERE conversation_id = $1
                ORDER BY created_at ASC
                LIMIT $2 OFFSET $3
            """, conversation_id, limit, offset)
        
        return [dict(r) for r in results]
    finally:
        await conn.close()


async def get_recent_messages_for_context(
    conversation_id: UUID,
    user_limit: int = 2,
    assistant_limit: int = 2
) -> List[Dict[str, Any]]:
    """
    Get the most recent messages for agent context.
    Retrieves last N user messages and last N assistant messages.
    
    Args:
        conversation_id: UUID of the conversation
        user_limit: Number of recent user messages to retrieve (default: 2)
        assistant_limit: Number of recent assistant messages to retrieve (default: 2)
        
    Returns:
        List of messages ordered by creation time, with max user_limit + assistant_limit messages
    """
    conn = await get_db_connection()
    try:
        results = await conn.fetch("""
            (
                SELECT * FROM messages
                WHERE conversation_id = $1 AND role = 'user'
                ORDER BY created_at DESC
                LIMIT $2
            )
            UNION ALL
            (
                SELECT * FROM messages
                WHERE conversation_id = $1 AND role = 'assistant'
                ORDER BY created_at DESC
                LIMIT $3
            )
            ORDER BY created_at ASC
        """, conversation_id, user_limit, assistant_limit)
        
        return [dict(r) for r in results]
    finally:
        await conn.close()


async def count_messages(conversation_id: UUID) -> int:
    """
    Count total messages in a conversation.
    
    Args:
        conversation_id: UUID of the conversation
        
    Returns:
        Total number of messages
    """
    conn = await get_db_connection()
    try:
        result = await conn.fetchval("""
            SELECT COUNT(*) FROM messages
            WHERE conversation_id = $1
        """, conversation_id)
        
        return result or 0
    finally:
        await conn.close()
