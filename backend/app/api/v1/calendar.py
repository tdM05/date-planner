"""
Calendar API endpoints for adding events to Google Calendar.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.core.models import User
from app.clients.google_calendar import get_calendar_client


router = APIRouter(prefix="/calendar", tags=["calendar"])


class AddEventRequest(BaseModel):
    """Request model for adding a calendar event."""

    summary: str
    start_time: str  # ISO datetime string
    end_time: str  # ISO datetime string
    location: Optional[str] = None
    description: Optional[str] = None


class AddEventResponse(BaseModel):
    """Response model for calendar event creation."""

    success: bool
    event_id: str
    event_link: str
    message: str


@router.post("/add-event", response_model=AddEventResponse)
async def add_calendar_event(
    request: AddEventRequest, current_user: User = Depends(get_current_user)
):
    """
    Add an event to the user's Google Calendar.

    Requires the user to have connected their Google Calendar.
    """
    try:
        # Parse datetime strings
        start_time = datetime.fromisoformat(request.start_time.replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(request.end_time.replace("Z", "+00:00"))

        # Get calendar client
        calendar_client = get_calendar_client()

        # Create event
        created_event = calendar_client.create_event(
            user_id=current_user.id,
            summary=request.summary,
            start_time=start_time,
            end_time=end_time,
            location=request.location,
            description=request.description,
        )

        return AddEventResponse(
            success=True,
            event_id=created_event["id"],
            event_link=created_event.get("htmlLink", ""),
            message=f"Event '{request.summary}' added to your calendar!",
        )

    except ValueError as e:
        # User doesn't have calendar connected
        raise HTTPException(status_code=428, detail=str(e))
    except Exception as e:
        # Other errors
        raise HTTPException(
            status_code=500, detail=f"Failed to create calendar event: {str(e)}"
        )
