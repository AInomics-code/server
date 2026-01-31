"""
User and authentication API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from uuid import UUID
from models.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    LoginResponse,
)
from services.user_service import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    list_users,
    update_user,
    delete_user,
)
from auth.jwt import verify_password, create_access_token
from auth.dependencies import get_current_user, require_admin
import asyncpg

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """
    Authenticate user and return JWT token.
    
    Args:
        login_data: Email and password
        
    Returns:
        JWT access token and user information
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Get user by email
    user = await get_user_by_email(login_data.email)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    # Convert UserInDB to UserResponse (exclude password_hash)
    user_response = UserResponse(
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        last_name=user.last_name,
        admin=user.admin,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current user from JWT token
        
    Returns:
        Current user information
    """
    return current_user


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_data: UserCreate,
    _: UserResponse = Depends(require_admin)
):
    """
    Create a new user (admin only).
    
    Args:
        user_data: User creation data
        _: Admin user (from dependency)
        
    Returns:
        Created user information
        
    Raises:
        HTTPException: If email already exists
    """
    try:
        user = await create_user(user_data)
        return user
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )


@router.get("/users", response_model=List[UserResponse])
async def get_users(
    _: UserResponse = Depends(require_admin)
):
    """
    List all users (admin only).
    
    Args:
        _: Admin user (from dependency)
        
    Returns:
        List of all users
    """
    users = await list_users()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    _: UserResponse = Depends(require_admin)
):
    """
    Get a specific user by ID (admin only).
    
    Args:
        user_id: User UUID
        _: Admin user (from dependency)
        
    Returns:
        User information
        
    Raises:
        HTTPException: If user not found
    """
    user = await get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_info(
    user_id: UUID,
    user_data: UserUpdate,
    _: UserResponse = Depends(require_admin)
):
    """
    Update a user's information (admin only).
    
    Args:
        user_id: User UUID
        user_data: Fields to update
        _: Admin user (from dependency)
        
    Returns:
        Updated user information
        
    Raises:
        HTTPException: If user not found or email already exists
    """
    try:
        user = await update_user(user_id, user_data)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        return user
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(
    user_id: UUID,
    _: UserResponse = Depends(require_admin)
):
    """
    Delete a user account (admin only).
    
    Args:
        user_id: User UUID
        _: Admin user (from dependency)
        
    Raises:
        HTTPException: If user not found
    """
    deleted = await delete_user(user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return None
