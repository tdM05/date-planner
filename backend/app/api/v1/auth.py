"""
Authentication API endpoints for Google OAuth flow.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse

from app.services.auth import get_auth_service, AuthService
from app.core.models import GoogleAuthURL, LoginResponse, UserResponse, RegisterRequest, LoginRequest, User, CalendarStatusResponse
from app.core.dependencies import get_current_user, get_current_user_optional
from app.utils.couple import get_user_couple, get_partner_id


router = APIRouter()


@router.get("/google/login", response_model=GoogleAuthURL)
def initiate_google_login(
    platform: str = Query("mobile", description="Platform: 'web' or 'mobile'"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Initiate Google OAuth login flow.

    Returns a URL that the client should redirect to for Google authentication.
    After authentication, Google will redirect back to the callback endpoint.

    If user is already logged in (has JWT), their user ID is embedded in the state
    parameter so the callback knows to update their existing account.

    Args:
        platform: 'web' or 'mobile' to determine redirect URL in callback
        current_user: Optional current user (if connecting calendar)

    Returns:
        GoogleAuthURL with the OAuth URL to redirect to
    """
    # Build state parameter with platform and optionally user_id
    if current_user:
        state = f"{platform}:user_id:{current_user.id}"
    else:
        state = platform

    auth_url = auth_service.get_google_auth_url(state=state)
    return GoogleAuthURL(authorization_url=auth_url)


@router.get("/google/callback")
def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="State parameter from OAuth flow"),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Handle Google OAuth callback.

    Supports two use cases:
    1. New user registration: No state or random state → Creates new user account
    2. Connect calendar: state contains "user_id:xxx" → Updates existing user's google_refresh_token

    State parameter format:
    - "web" or "mobile" for platform indication
    - "web:user_id:xxx" for existing web user connecting calendar
    - "mobile:user_id:xxx" for existing mobile user connecting calendar

    Args:
        code: Authorization code from Google OAuth flow
        state: Optional state parameter that may contain platform and user_id

    Returns:
        RedirectResponse to app with token in URL
    """
    try:
        # Parse state parameter
        platform = "mobile"  # Default to mobile for backward compatibility
        current_user = None

        if state:
            parts = state.split(":")
            if len(parts) >= 1:
                platform = parts[0] if parts[0] in ["web", "mobile"] else "mobile"
            if len(parts) >= 3 and parts[1] == "user_id":
                # Existing user connecting calendar
                from uuid import UUID
                user_id = UUID(parts[2])
                current_user = auth_service.get_user_by_id(user_id)

        # Handle OAuth callback
        result = auth_service.handle_oauth_callback(code, current_user)

        # Determine redirect URL based on platform
        if isinstance(result, dict):
            # Existing user connecting calendar - redirect back to app
            redirect_url = "dateplanner://oauth/callback?success=true" if platform == "mobile" else "http://localhost:8081/oauth/callback?success=true"
        else:
            # New user - include token
            token = result.access_token
            redirect_url = f"dateplanner://oauth/callback?token={token}" if platform == "mobile" else f"http://localhost:8081/oauth/callback?token={token}"

        return RedirectResponse(url=redirect_url)
    except Exception as e:
        # Redirect to error page
        error_msg = str(e).replace(" ", "+")
        redirect_url = f"dateplanner://oauth/callback?error={error_msg}" if platform == "mobile" else f"http://localhost:8081/oauth/callback?error={error_msg}"
        return RedirectResponse(url=redirect_url)


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


@router.get("/calendar-status", response_model=CalendarStatusResponse)
def get_calendar_status(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Check Google Calendar connection status for user and their partner.

    Returns calendar connection status for the current user and their partner (if in a couple).
    This allows the frontend to proactively display calendar status and show appropriate
    "Connect Calendar" buttons before attempting to generate dates.

    Returns:
        CalendarStatusResponse with:
        - user_connected: Whether current user has Google Calendar connected
        - partner_connected: Whether partner has Google Calendar connected
        - both_connected: Convenience flag (true only if both connected)
        - partner_email: Partner's email if user is in a couple
    """
    # Check if current user has Google Calendar connected
    user_has_calendar = current_user.google_refresh_token is not None

    # Check if user is in a couple
    couple = get_user_couple(current_user.id)

    partner_has_calendar = False
    partner_email = None

    if couple:
        # Get partner's ID and user object
        partner_id = get_partner_id(current_user.id, couple)
        partner = auth_service.get_user_by_id(partner_id)

        if partner:
            partner_has_calendar = partner.google_refresh_token is not None
            partner_email = partner.email

    return CalendarStatusResponse(
        user_connected=user_has_calendar,
        partner_connected=partner_has_calendar,
        both_connected=user_has_calendar and partner_has_calendar,
        partner_email=partner_email
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
