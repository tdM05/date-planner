from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from uuid import UUID


# ============================================================================
# Date Generation Models
# ============================================================================

class DateGenerationRequest(BaseModel):
    """Simple date generation request (legacy)"""
    prompt: str
    time_frame: str
    location: str


class CoupleeDateGenerationRequest(BaseModel):
    """Enhanced date generation request using couple's calendars"""
    prompt: str = Field(
        ...,
        description="Description of desired date type",
        examples=["romantic date night", "fun outdoor activity", "cozy dinner"]
    )
    start_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Start date and time for date search (ISO 8601 format: YYYY-MM-DDTHH:MM:SS)",
        examples=["2025-11-17T18:00:00"]
    )
    end_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7),
        description="End date and time for date search (ISO 8601 format: YYYY-MM-DDTHH:MM:SS)",
        examples=["2025-11-24T18:00:00"]
    )
    location: str = Field(
        ...,
        description="Location for the date",
        examples=["Toronto, ON", "San Francisco, CA", "New York, NY"]
    )


class Event(BaseModel):
    name: str
    reason: str
    suggested_time: Optional[str] = None


class DatePlanResponse(BaseModel):
    events: List[Event]
    free_time_slots: Optional[List[Dict]] = None


# ============================================================================
# User & Authentication Models
# ============================================================================

class User(BaseModel):
    """User database model"""
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    google_refresh_token: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Model for creating a new user"""
    email: EmailStr
    full_name: str
    google_refresh_token: str


class UserResponse(BaseModel):
    """Public user response (excludes tokens)"""
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime


class LoginResponse(BaseModel):
    """Response from login endpoint"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleAuthURL(BaseModel):
    """Response containing Google OAuth URL"""
    auth_url: str


class CalendarStatusResponse(BaseModel):
    """Response indicating calendar connection status for user and partner"""
    user_connected: bool = Field(..., description="Whether current user has Google Calendar connected")
    partner_connected: bool = Field(..., description="Whether partner has Google Calendar connected")
    both_connected: bool = Field(..., description="Convenience flag - true only if both have calendars connected")
    partner_email: Optional[str] = Field(None, description="Partner's email address if user is in a couple")


class RegisterRequest(BaseModel):
    """Request for email/password registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72, description="Password must be 8-72 characters")
    full_name: str


class LoginRequest(BaseModel):
    """Request for email/password login"""
    email: EmailStr
    password: str


# ============================================================================
# Couple & Invitation Models
# ============================================================================

class Couple(BaseModel):
    """Couple database model"""
    id: UUID
    partner1_id: UUID
    partner2_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CoupleResponse(BaseModel):
    """Response with couple and partner information"""
    couple_id: UUID
    partner: UserResponse
    created_at: datetime


class Invitation(BaseModel):
    """Invitation database model"""
    id: UUID
    inviter_id: UUID
    invitee_email: EmailStr
    token: str
    status: str  # 'pending', 'accepted', 'expired'
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class InvitationCreate(BaseModel):
    """Request to create an invitation"""
    invitee_email: EmailStr


class InvitationResponse(BaseModel):
    """Response after creating invitation"""
    invitation_id: UUID
    invitee_email: EmailStr
    token: str
    expires_at: datetime


class AcceptInvitationRequest(BaseModel):
    """Request to accept an invitation"""
    token: str
