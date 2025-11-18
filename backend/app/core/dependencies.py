"""
FastAPI dependencies for authentication and authorization.
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.auth import get_auth_service, AuthService
from app.core.models import User
from app.config import settings


# Security scheme for JWT bearer token
security = HTTPBearer(auto_error=False)  # Don't auto-error so we can handle dev bypass


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    In development mode with DISABLE_AUTH_IN_DEV=true, bypasses auth and returns test user.

    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        auth_service: Auth service instance

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    # DEVELOPMENT BYPASS: Skip authentication if enabled
    if settings.is_development and settings.disable_auth_in_dev:
        print(f"--- DEV MODE: Auth bypassed, using test user {settings.test_user_id} ---")
        test_user = auth_service.get_user_by_id(UUID(settings.test_user_id))
        if test_user is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Test user {settings.test_user_id} not found in database",
            )
        return test_user

    # Normal authentication flow
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Verify token and get user ID
    user_id = auth_service.verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    user = auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    auth_service: AuthService = Depends(get_auth_service)
) -> Optional[User]:
    """
    Optional dependency to get current user (does not require authentication).
    In development mode with DISABLE_AUTH_IN_DEV=true, returns the test user.

    Args:
        credentials: Optional HTTP Authorization credentials
        auth_service: Auth service instance

    Returns:
        User object if authenticated, None otherwise
    """
    # DEVELOPMENT BYPASS: Return test user if auth is disabled
    if settings.is_development and settings.disable_auth_in_dev:
        print(f"--- DEV MODE (optional): Using test user {settings.test_user_id} ---")
        test_user = auth_service.get_user_by_id(UUID(settings.test_user_id))
        return test_user

    # Normal flow
    if credentials is None:
        return None

    token = credentials.credentials
    user_id = auth_service.verify_token(token)

    if user_id is None:
        return None

    return auth_service.get_user_by_id(user_id)
