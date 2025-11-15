from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime
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
    prompt: str
    time_frame_days: int = Field(default=7, description="Number of days from today to search")
    location: str


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
