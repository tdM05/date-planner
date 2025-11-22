"""
Authentication service for Google OAuth flow and JWT token management.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Union
from uuid import UUID
import secrets

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.clients.db import get_db
from app.core.models import User, UserCreate, UserResponse, LoginResponse, RegisterRequest, LoginRequest
from ._base import AbstractService


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# OAuth 2.0 scopes for Google Calendar (read/write) and user info
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar',  # Write access for creating events
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]


class AuthService(AbstractService):
    """Service for handling authentication and OAuth flows."""

    def __init__(self):
        self.db = get_db()

    def get_google_auth_url(self, state: Optional[str] = None, redirect_uri: Optional[str] = None) -> str:
        """
        Generate Google OAuth authorization URL.

        Args:
            state: Optional state parameter for CSRF protection
            redirect_uri: Optional custom redirect URI (for platform-specific flows)

        Returns:
            Authorization URL to redirect user to
        """
        if state is None:
            state = secrets.token_urlsafe(32)

        # Use custom redirect URI if provided, otherwise use default from settings
        oauth_redirect_uri = redirect_uri or settings.google_redirect_uri

        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [oauth_redirect_uri]
                }
            },
            scopes=SCOPES,
            redirect_uri=oauth_redirect_uri
        )

        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'  # Force consent to get refresh token
        )

        return authorization_url

    def handle_oauth_callback(self, code: str, current_user: Optional[User] = None, redirect_uri: Optional[str] = None) -> Union[LoginResponse, Dict]:
        """
        Handle OAuth callback, exchange code for tokens, and create/update user.

        Supports two use cases:
        1. New user registration: No current_user → Creates new user account
        2. Connect calendar: Has current_user → Updates existing user's google_refresh_token

        Args:
            code: Authorization code from Google OAuth callback
            current_user: Optional - if provided, connects calendar to this user
            redirect_uri: Optional - must match the redirect URI used in authorization URL

        Returns:
            - If new user: LoginResponse with access token and user info
            - If existing user: Dict with success message
        """
        # Exchange authorization code for tokens
        # Must use the same redirect URI as in the authorization URL
        oauth_redirect_uri = redirect_uri or settings.google_redirect_uri

        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [oauth_redirect_uri]
                }
            },
            scopes=SCOPES,
            redirect_uri=oauth_redirect_uri
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        # CHECK: Is user already logged in?
        if current_user:
            # EXISTING USER: Just update their refresh_token
            self.db.table('users').update({
                'google_refresh_token': credentials.refresh_token
            }).eq('id', str(current_user.id)).execute()

            return {
                "message": "Calendar connected successfully",
                "user_id": str(current_user.id)
            }
        else:
            # NEW USER: Create account (existing behavior)
            # Get user info from Google
            user_info = self._get_google_user_info(credentials)

            # Create or update user in database
            user = self._create_or_update_user(
                email=user_info['email'],
                full_name=user_info.get('name', ''),
                google_refresh_token=credentials.refresh_token
            )

            # Generate JWT token
            access_token = self._create_access_token(user.id)

            return LoginResponse(
                access_token=access_token,
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    created_at=user.created_at
                )
            )

    def _get_google_user_info(self, credentials: Credentials) -> Dict:
        """
        Fetch user info from Google using OAuth credentials.

        Args:
            credentials: Google OAuth credentials

        Returns:
            Dictionary with user information (email, name, etc.)
        """
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        return user_info

    def _create_or_update_user(
        self,
        email: str,
        full_name: str,
        google_refresh_token: Optional[str]
    ) -> User:
        """
        Create new user or update existing user in database.

        Args:
            email: User's email address
            full_name: User's full name
            google_refresh_token: Google OAuth refresh token

        Returns:
            User object
        """
        # Check if user exists
        result = self.db.table('users').select('*').eq('email', email).execute()

        if result.data:
            # Update existing user
            user_data = result.data[0]

            # Update refresh token if provided
            update_data = {'full_name': full_name}
            if google_refresh_token:
                update_data['google_refresh_token'] = google_refresh_token

            updated = self.db.table('users').update(update_data).eq('email', email).execute()
            user_data = updated.data[0]
        else:
            # Create new user
            new_user = {
                'email': email,
                'full_name': full_name,
                'google_refresh_token': google_refresh_token
            }
            created = self.db.table('users').insert(new_user).execute()
            user_data = created.data[0]

        return User(**user_data)

    def _create_access_token(self, user_id: UUID) -> str:
        """
        Create JWT access token for user.

        Args:
            user_id: User's UUID

        Returns:
            JWT token string
        """
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)
        to_encode = {
            "sub": str(user_id),
            "exp": expire
        }
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm
        )
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[UUID]:
        """
        Verify JWT token and extract user ID.

        Args:
            token: JWT token string

        Returns:
            User UUID if valid, None otherwise
        """
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return UUID(user_id)
        except JWTError:
            return None

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """
        Fetch user from database by ID.

        Args:
            user_id: User's UUID

        Returns:
            User object if found, None otherwise
        """
        result = self.db.table('users').select('*').eq('id', str(user_id)).execute()

        if result.data:
            return User(**result.data[0])
        return None

    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        # Truncate password to 72 bytes (bcrypt limitation) as defensive measure
        password_truncated = password[:72]
        return pwd_context.hash(password_truncated)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        # Truncate password to 72 bytes for consistency with hashing
        password_truncated = plain_password[:72]
        return pwd_context.verify(password_truncated, hashed_password)

    def register_user(self, request: RegisterRequest) -> LoginResponse:
        """
        Register a new user with email and password.

        Args:
            request: Registration request with email, password, and full_name

        Returns:
            LoginResponse with JWT token and user info

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        result = self.db.table('users').select('*').eq('email', request.email).execute()

        if result.data:
            raise ValueError(f"Email {request.email} is already registered")

        # Hash the password
        password_hash = self._hash_password(request.password)

        # Create user in database
        new_user = {
            'email': request.email,
            'full_name': request.full_name,
            'password_hash': password_hash
        }
        created = self.db.table('users').insert(new_user).execute()
        user_data = created.data[0]

        # Create user object
        user = User(**user_data)

        # Generate JWT token
        access_token = self._create_access_token(user.id)

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at
            )
        )

    def login_user(self, request: LoginRequest) -> LoginResponse:
        """
        Login user with email and password.

        Args:
            request: Login request with email and password

        Returns:
            LoginResponse with JWT token and user info

        Raises:
            ValueError: If email not found or password incorrect
        """
        # Find user by email
        result = self.db.table('users').select('*').eq('email', request.email).execute()

        if not result.data:
            raise ValueError("Invalid email or password")

        user_data = result.data[0]

        # Check if user has a password hash (might be Google OAuth only user)
        if not user_data.get('password_hash'):
            raise ValueError("This account uses Google OAuth. Please sign in with Google.")

        # Verify password
        if not self._verify_password(request.password, user_data['password_hash']):
            raise ValueError("Invalid email or password")

        # Create user object
        user = User(**user_data)

        # Generate JWT token
        access_token = self._create_access_token(user.id)

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at
            )
        )


def get_auth_service() -> AuthService:
    """Dependency function to get AuthService instance."""
    return AuthService()
