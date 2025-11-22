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
from app.services.couples import get_couples_service, CouplesService


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
    added_to_partner_calendar: bool = False


class CalendarEvent(BaseModel):
    """Calendar event model."""

    summary: str
    start: str
    end: str
    description: str = ""


class GetEventsResponse(BaseModel):
    """Response model for getting calendar events."""

    events: list[CalendarEvent]
    user_name: str


class FreeSlot(BaseModel):
    """Free time slot model."""

    start: str
    end: str
    duration_hours: float


class GetFreeSlotsResponse(BaseModel):
    """Response model for getting free time slots."""

    free_slots: list[FreeSlot]
    time_frame_start: str
    time_frame_end: str


@router.post("/add-event", response_model=AddEventResponse)
async def add_calendar_event(
    request: AddEventRequest,
    current_user: User = Depends(get_current_user),
    couples_service: CouplesService = Depends(get_couples_service),
):
    """
    Add an event to the user's Google Calendar and their partner's calendar if connected.

    Requires the user to have connected their Google Calendar.
    If the user has a partner with a connected calendar, the event will be added to both calendars.
    """
    try:
        # Parse datetime strings
        start_time = datetime.fromisoformat(request.start_time.replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(request.end_time.replace("Z", "+00:00"))

        # Get calendar client
        calendar_client = get_calendar_client()

        # Create event for current user
        created_event = calendar_client.create_event(
            user_id=current_user.id,
            summary=request.summary,
            start_time=start_time,
            end_time=end_time,
            location=request.location,
            description=request.description,
        )

        # Check if user has a partner and try to add to their calendar too
        added_to_partner_calendar = False
        try:
            partner_info = couples_service.get_partner(current_user.id)
            if partner_info:
                # Try to add event to partner's calendar
                # This will only work if partner has connected their Google Calendar
                try:
                    calendar_client.create_event(
                        user_id=partner_info.partner.id,
                        summary=request.summary,
                        start_time=start_time,
                        end_time=end_time,
                        location=request.location,
                        description=request.description,
                    )
                    added_to_partner_calendar = True
                except ValueError:
                    # Partner doesn't have calendar connected - that's okay
                    pass
        except Exception:
            # If getting partner fails, continue without error
            pass

        message = f"Event '{request.summary}' added to your calendar!"
        if added_to_partner_calendar:
            message += " Also added to your partner's calendar!"

        return AddEventResponse(
            success=True,
            event_id=created_event["id"],
            event_link=created_event.get("htmlLink", ""),
            message=message,
            added_to_partner_calendar=added_to_partner_calendar,
        )

    except ValueError as e:
        # User doesn't have calendar connected
        raise HTTPException(status_code=428, detail=str(e))
    except Exception as e:
        # Other errors
        raise HTTPException(
            status_code=500, detail=f"Failed to create calendar event: {str(e)}"
        )


@router.get("/my-events", response_model=GetEventsResponse)
async def get_my_events(
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get calendar events for the current user within a date range.
    """
    try:
        # Parse datetime strings
        time_min = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        time_max = datetime.fromisoformat(end_date.replace("Z", "+00:00"))

        # Get calendar client
        calendar_client = get_calendar_client()

        # Get events
        events = calendar_client.get_events(current_user.id, time_min, time_max)

        return GetEventsResponse(
            events=[CalendarEvent(**event) for event in events],
            user_name=current_user.full_name,
        )

    except ValueError as e:
        raise HTTPException(status_code=428, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get calendar events: {str(e)}"
        )


@router.get("/partner-events", response_model=GetEventsResponse)
async def get_partner_events(
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_user),
    couples_service: CouplesService = Depends(get_couples_service),
):
    """
    Get calendar events for the current user's partner within a date range.
    """
    try:
        # Get partner info
        partner_info = couples_service.get_partner(current_user.id)
        if not partner_info:
            raise HTTPException(status_code=404, detail="No partner found")

        # Parse datetime strings
        time_min = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        time_max = datetime.fromisoformat(end_date.replace("Z", "+00:00"))

        # Get calendar client
        calendar_client = get_calendar_client()

        # Get events
        events = calendar_client.get_events(
            partner_info.partner.id, time_min, time_max
        )

        return GetEventsResponse(
            events=[CalendarEvent(**event) for event in events],
            user_name=partner_info.partner.full_name,
        )

    except ValueError as e:
        raise HTTPException(status_code=428, detail="Partner calendar not connected")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get partner calendar events: {str(e)}"
        )


@router.get("/free-slots", response_model=GetFreeSlotsResponse)
async def get_free_slots(
    start_date: str,
    end_date: str,
    min_duration_hours: float = 2.0,
    current_user: User = Depends(get_current_user),
    couples_service: CouplesService = Depends(get_couples_service),
):
    """
    Get mutual free time slots for the current user and their partner.
    """
    try:
        # Get partner info
        partner_info = couples_service.get_partner(current_user.id)
        if not partner_info:
            raise HTTPException(status_code=404, detail="No partner found")

        # Parse datetime strings
        time_min = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        time_max = datetime.fromisoformat(end_date.replace("Z", "+00:00"))

        # Get calendar client
        calendar_client = get_calendar_client()

        # Find free slots
        free_slots = calendar_client.find_free_slots(
            current_user.id,
            partner_info.partner.id,
            time_min,
            time_max,
            min_duration_hours,
        )

        return GetFreeSlotsResponse(
            free_slots=[FreeSlot(**slot) for slot in free_slots],
            time_frame_start=time_min.isoformat(),
            time_frame_end=time_max.isoformat(),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=428, detail="Both calendars must be connected to find free slots"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to find free slots: {str(e)}"
        )
