"""
User database service for CRUD operations.
"""
import asyncpg
from typing import Optional, List
from uuid import UUID
from models.user import UserCreate, UserUpdate, UserResponse, UserInDB
from config import get_settings
from auth.jwt import get_password_hash

settings = get_settings()


async def get_db_connection():
    """
    Create and return a database connection.
    
    Returns:
        asyncpg connection object
    """
    return await asyncpg.connect(
        host=settings.postgres_host,
        port=settings.postgres_port,
        database=settings.postgres_db,
        user=settings.postgres_user,
        password=settings.postgres_password,
    )


async def create_user(user_data: UserCreate) -> UserResponse:
    """
    Create a new user in the database.
    
    Args:
        user_data: UserCreate object with user information
        
    Returns:
        UserResponse object of the created user
        
    Raises:
        asyncpg.UniqueViolationError: If email already exists
    """
    conn = await get_db_connection()
    try:
        password_hash = get_password_hash(user_data.password)
        
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, password_hash, name, last_name, admin)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, email, name, last_name, admin, created_at, updated_at
            """,
            user_data.email,
            password_hash,
            user_data.name,
            user_data.last_name,
            user_data.admin,
        )
        
        return UserResponse(**dict(row))
    finally:
        await conn.close()


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """
    Get a user by email address.
    
    Args:
        email: User's email address
        
    Returns:
        UserInDB object if found, None otherwise
    """
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            SELECT user_id, email, password_hash, name, last_name, admin, 
                   created_at, updated_at
            FROM users
            WHERE email = $1
            """,
            email,
        )
        
        if row is None:
            return None
        
        return UserInDB(**dict(row))
    finally:
        await conn.close()


async def get_user_by_id(user_id: UUID) -> Optional[UserResponse]:
    """
    Get a user by user ID.
    
    Args:
        user_id: User's UUID
        
    Returns:
        UserResponse object if found, None otherwise
    """
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            SELECT user_id, email, name, last_name, admin, created_at, updated_at
            FROM users
            WHERE user_id = $1
            """,
            user_id,
        )
        
        if row is None:
            return None
        
        return UserResponse(**dict(row))
    finally:
        await conn.close()


async def list_users() -> List[UserResponse]:
    """
    List all users in the system.
    
    Returns:
        List of UserResponse objects
    """
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT user_id, email, name, last_name, admin, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            """
        )
        
        return [UserResponse(**dict(row)) for row in rows]
    finally:
        await conn.close()


async def update_user(user_id: UUID, user_data: UserUpdate) -> Optional[UserResponse]:
    """
    Update a user's information.
    
    Args:
        user_id: User's UUID
        user_data: UserUpdate object with fields to update
        
    Returns:
        Updated UserResponse object if found, None otherwise
    """
    conn = await get_db_connection()
    try:
        # Build dynamic UPDATE query based on provided fields
        update_fields = []
        values = []
        param_count = 1
        
        if user_data.email is not None:
            update_fields.append(f"email = ${param_count}")
            values.append(user_data.email)
            param_count += 1
        
        if user_data.name is not None:
            update_fields.append(f"name = ${param_count}")
            values.append(user_data.name)
            param_count += 1
        
        if user_data.last_name is not None:
            update_fields.append(f"last_name = ${param_count}")
            values.append(user_data.last_name)
            param_count += 1
        
        if user_data.password is not None:
            update_fields.append(f"password_hash = ${param_count}")
            values.append(get_password_hash(user_data.password))
            param_count += 1
        
        if user_data.admin is not None:
            update_fields.append(f"admin = ${param_count}")
            values.append(user_data.admin)
            param_count += 1
        
        if not update_fields:
            # No fields to update, return current user
            return await get_user_by_id(user_id)
        
        # Add user_id as the last parameter
        values.append(user_id)
        
        query = f"""
            UPDATE users
            SET {', '.join(update_fields)}
            WHERE user_id = ${param_count}
            RETURNING user_id, email, name, last_name, admin, created_at, updated_at
        """
        
        row = await conn.fetchrow(query, *values)
        
        if row is None:
            return None
        
        return UserResponse(**dict(row))
    finally:
        await conn.close()


async def delete_user(user_id: UUID) -> bool:
    """
    Delete a user from the database.
    
    Args:
        user_id: User's UUID
        
    Returns:
        True if user was deleted, False if not found
    """
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            """
            DELETE FROM users
            WHERE user_id = $1
            """,
            user_id,
        )
        
        # Check if any rows were affected
        return result.split()[-1] == "1"
    finally:
        await conn.close()
