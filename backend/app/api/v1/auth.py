"""
Authentication API endpoints for Google OAuth flow.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse

from app.services.auth import get_auth_service, AuthService
from app.core.models import GoogleAuthURL, LoginResponse, UserResponse
from app.core.dependencies import get_current_user


router = APIRouter()


@router.get("/google/login", response_model=GoogleAuthURL)
def initiate_google_login(
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Initiate Google OAuth login flow.

    Returns a URL that the client should redirect to for Google authentication.
    After authentication, Google will redirect back to the callback endpoint.
    """
    auth_url = auth_service.get_google_auth_url()
    return GoogleAuthURL(auth_url=auth_url)


@router.get("/google/callback", response_model=LoginResponse)
def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Handle Google OAuth callback.

    Receives the authorization code from Google, exchanges it for tokens,
    creates/updates the user in the database, and returns a JWT token.

    Args:
        code: Authorization code from Google OAuth flow

    Returns:
        LoginResponse with JWT token and user information
    """
    try:
        login_response = auth_service.handle_oauth_callback(code)
        return login_response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Google: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """
    Get current authenticated user's information.

    Requires valid JWT token in Authorization header.

    Returns:
        User information (excluding sensitive data like tokens)
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at
    )
