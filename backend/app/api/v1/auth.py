"""
Authentication API endpoints for Google OAuth flow.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse

from app.services.auth import get_auth_service, AuthService
from app.core.models import GoogleAuthURL, LoginResponse, UserResponse, RegisterRequest, LoginRequest
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


@router.post("/register", response_model=LoginResponse)
def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Register a new user with email and password.

    Creates a new user account and returns a JWT token for immediate login.

    Args:
        request: Registration data (email, password, full_name)

    Returns:
        LoginResponse with JWT token and user information

    Raises:
        400: If email already exists
        500: If registration fails
    """
    try:
        return auth_service.register_user(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Login with email and password.

    Authenticates user and returns a JWT token.

    Args:
        request: Login credentials (email, password)

    Returns:
        LoginResponse with JWT token and user information

    Raises:
        401: If email or password is incorrect
        500: If login fails
    """
    try:
        return auth_service.login_user(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
