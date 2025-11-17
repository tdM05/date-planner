from fastapi import APIRouter, Depends, HTTPException, status

from app.core.models import (
    DateGenerationRequest,
    CoupleeDateGenerationRequest,
    DatePlanResponse,
    User,
)
from app.services.date_generator import (
    DateGeneratorService,
    get_date_generator_service,
)
from app.core.dependencies import get_current_user

router = APIRouter()


@router.post("/generate-date-plan", response_model=DatePlanResponse)
def generate_date(
    request: DateGenerationRequest,
    service: DateGeneratorService = Depends(get_date_generator_service),
):
    """
    Legacy API endpoint to generate a date plan without calendar integration.

    This endpoint doesn't require authentication and doesn't use calendar data.
    For calendar-aware date generation, use /generate-couple-date-plan instead.
    """
    try:
        return service.generate_plan(request)
    except Exception as e:
        # In a real app, you'd have more specific error handling and logging.
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-couple-date-plan", response_model=DatePlanResponse)
def generate_couple_date(
    request: CoupleeDateGenerationRequest,
    current_user: User = Depends(get_current_user),
    service: DateGeneratorService = Depends(get_date_generator_service),
):
    """
    Generate a date plan using couple's calendar data.

    Requires authentication. Fetches both partners' calendars, finds mutual
    free time, and generates date suggestions that fit into available slots.

    This implements Algorithm 1 and 2 from your pseudocode:
    - Fetches both users' calendars via Google Calendar API
    - Finds mutual free time slots
    - Gets weather forecast
    - Uses Claude AI to generate contextual date suggestions
    - Finds real places using Google Places API

    Args:
        request: Date generation parameters (prompt, location, timeframe)
        current_user: Authenticated user (from JWT token)
        service: Date generator service instance

    Returns:
        DatePlanResponse with suggested events and free time slots

    Raises:
        HTTPException: If user is not in a couple or generation fails
    """
    try:
        return service.generate_couple_date_plan(
            user_id=current_user.id, request=request
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate date plan: {str(e)}",
        )
