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
from app.config import settings


router = APIRouter()


import base64
from urllib.parse import urlparse


def validate_redirect_url(url: str) -> bool:
    """
    Validate redirect URL to prevent open redirect vulnerabilities.

    Args:
        url: The redirect URL to validate

    Returns:
        True if URL is allowed, False otherwise
    """
    try:
        parsed = urlparse(url)

        # Allow localhost for development
        if parsed.hostname in ['localhost', '127.0.0.1']:
            return True

        # Allow dateplanner deep link scheme for mobile
        if parsed.scheme == 'dateplanner':
            return True

        # Allow HTTPS URLs from trusted domains
        # Add your production domain here when you deploy frontend
        allowed_domains = [
            # Add production domains here, e.g.:
            # 'yourdomain.com',
            # 'app.yourdomain.com',
        ]

        if parsed.scheme == 'https' and parsed.hostname in allowed_domains:
            return True

        return False
    except Exception:
        return False


@router.get("/google/login", response_model=GoogleAuthURL)
def initiate_google_login(
    platform: str = Query("mobile", description="Platform: 'web' or 'mobile'"),
    redirect_url: Optional[str] = Query(None, description="Redirect URL after OAuth completes"),
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
        redirect_url: Optional redirect URL to return to after OAuth (for dynamic routing)
        current_user: Optional current user (if connecting calendar)

    Returns:
        GoogleAuthURL with the OAuth URL to redirect to
    """
    # Validate redirect URL if provided
    if redirect_url and not validate_redirect_url(redirect_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid redirect URL: {redirect_url}"
        )

    # Build state parameter with platform, optionally user_id, and optionally redirect_url
    state_parts = [platform]

    if current_user:
        state_parts.extend(["user_id", str(current_user.id)])

    if redirect_url:
        # Base64 encode the redirect URL to safely include in state
        encoded_redirect = base64.urlsafe_b64encode(redirect_url.encode()).decode()
        state_parts.extend(["redirect", encoded_redirect])

    state = ":".join(state_parts)

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
    - "{platform}" - e.g. "web" or "mobile"
    - "{platform}:user_id:{uuid}" - e.g. "web:user_id:xxx"
    - "{platform}:redirect:{base64_url}" - e.g. "web:redirect:aHR0cDov..."
    - "{platform}:user_id:{uuid}:redirect:{base64_url}" - full format with all params

    Args:
        code: Authorization code from Google OAuth flow
        state: Optional state parameter that may contain platform, user_id, and redirect_url

    Returns:
        RedirectResponse to app with token in URL
    """
    try:
        # Parse state parameter
        platform = "mobile"  # Default to mobile for backward compatibility
        current_user = None
        custom_redirect_url = None

        if state:
            parts = state.split(":")

            # Extract platform (first part)
            if len(parts) >= 1:
                platform = parts[0] if parts[0] in ["web", "mobile"] else "mobile"

            # Parse remaining parts for user_id and redirect
            i = 1
            while i < len(parts):
                if parts[i] == "user_id" and i + 1 < len(parts):
                    # Extract user_id
                    from uuid import UUID
                    try:
                        user_id = UUID(parts[i + 1])
                        current_user = auth_service.get_user_by_id(user_id)
                    except Exception:
                        pass
                    i += 2
                elif parts[i] == "redirect" and i + 1 < len(parts):
                    # Extract and decode redirect URL
                    try:
                        custom_redirect_url = base64.urlsafe_b64decode(parts[i + 1]).decode()
                    except Exception:
                        pass
                    i += 2
                else:
                    i += 1

        # Handle OAuth callback
        result = auth_service.handle_oauth_callback(code, current_user)

        # Determine redirect URL
        # Priority: custom_redirect_url > platform-based default
        if custom_redirect_url:
            # Use custom redirect URL (passed from frontend)
            base_url = custom_redirect_url
        elif platform == "mobile":
            # Default mobile deep link
            base_url = "dateplanner://"
        else:
            # Fallback to localhost for web (should not reach here if frontend sends redirect)
            base_url = "http://localhost:8081"

        # Build final redirect URL with parameters
        if isinstance(result, dict):
            # Existing user connecting calendar
            redirect_url = f"{base_url}/oauth/callback?success=true"
        else:
            # New user - include token
            token = result.access_token
            redirect_url = f"{base_url}/oauth/callback?token={token}"

        return RedirectResponse(url=redirect_url)
    except Exception as e:
        # Redirect to error page
        error_msg = str(e).replace(" ", "+")

        # Try to use custom redirect URL for error too
        if custom_redirect_url:
            base_url = custom_redirect_url
        elif platform == "mobile":
            base_url = "dateplanner://"
        else:
            base_url = "http://localhost:8081"

        redirect_url = f"{base_url}/oauth/callback?error={error_msg}"
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
