from datetime import datetime, timedelta
from typing import List, Dict
from uuid import UUID
from fastapi import Depends

from app.clients.claude import get_claude_client, RealClaudeClient, MockClaudeClient
from app.clients.google import get_google_client, RealGoogleClient, MockGoogleClient
from app.clients.weather import get_weather_client, RealWeatherClient, MockWeatherClient
from app.clients.google_calendar import get_calendar_client, GoogleCalendarClient
from app.clients.db import get_db
from app.core.models import (
    DateGenerationRequest,
    CoupleeDateGenerationRequest,
    DatePlanResponse,
    Event
)
from ._base import AbstractService

# Using the real classes for type hinting improves editor support.
ClaudeClient = RealClaudeClient | MockClaudeClient
GoogleClient = RealGoogleClient | MockGoogleClient
WeatherClient = RealWeatherClient | MockWeatherClient


class DateGeneratorService(AbstractService):
    def __init__(
        self,
        claude_client: ClaudeClient,
        google_client: GoogleClient,
        weather_client: WeatherClient,
        calendar_client: GoogleCalendarClient = None,
    ):
        self.claude = claude_client
        self.google = google_client
        self.weather = weather_client
        self.calendar = calendar_client
        self.db = get_db() if calendar_client else None

    def generate_plan(self, request: DateGenerationRequest) -> DatePlanResponse:
        """
        Legacy method: Coordinates clients to generate a date plan.
        This doesn't use calendar integration.
        """
        # 1. Get weather (example of using a client)
        weather_info = self.weather.get_weather(request.location, request.time_frame)

        # 2. Get date ideas from Claude
        ideas_prompt = f"Based on this prompt: '{request.prompt}' and the weather '{weather_info['forecast']}', give me date ideas."
        ideas = self.claude.generate_ideas(ideas_prompt)

        # 3. Find real places for each idea
        events = []
        for idea in ideas.get("ideas", []):
            place = self.google.find_place(idea)
            event = Event(
                name=place.get("name", "Unknown Place"),
                reason=f"A great place for '{idea}'."
            )
            events.append(event)

        return DatePlanResponse(events=events)

    def generate_couple_date_plan(
        self,
        user_id: UUID,
        request: CoupleeDateGenerationRequest
    ) -> DatePlanResponse:
        """
        Enhanced method: Generate date plan using couple's calendar data.
        Implements Algorithm 1 from your pseudocode.

        Args:
            user_id: ID of user making the request
            request: Date generation parameters

        Returns:
            DatePlanResponse with events and free time slots

        Raises:
            ValueError: If user is not in a couple or calendar access fails
        """
        # Get user's couple relationship
        couple = self._get_user_couple(user_id)
        if not couple:
            raise ValueError("You must be in a couple to use this feature")

        # Get both partner IDs
        partner1_id = UUID(couple['partner1_id'])
        partner2_id = UUID(couple['partner2_id'])

        # Calculate time frame
        time_frame_start = datetime.utcnow()
        time_frame_end = time_frame_start + timedelta(days=request.time_frame_days)

        # Get free time slots for the couple (Algorithm 1)
        free_slots = self.calendar.find_free_slots(
            user1_id=partner1_id,
            user2_id=partner2_id,
            time_frame_start=time_frame_start,
            time_frame_end=time_frame_end,
            slot_duration_hours=2.0
        )

        if not free_slots:
            raise ValueError("No mutual free time found in the specified time frame")

        # Get weather forecast
        weather_info = self.weather.get_weather(
            request.location,
            f"{request.time_frame_days} days"
        )

        # Get calendar context for better AI suggestions
        user1_context = self.calendar.get_events_context(
            partner1_id, time_frame_start, time_frame_end
        )
        user2_context = self.calendar.get_events_context(
            partner2_id, time_frame_start, time_frame_end
        )

        # Build prompt for Claude (Algorithm 2)
        free_slots_summary = self._format_free_slots(free_slots[:5])  # Top 5 slots
        claude_prompt = f"""
Generate date ideas based on the following information:

User's Request: {request.prompt}
Location: {request.location}
Weather Forecast: {weather_info['forecast']}

Available Free Time Slots:
{free_slots_summary}

Partner 1's Schedule Context:
{user1_context}

Partner 2's Schedule Context:
{user2_context}

Please suggest 3-5 specific date ideas that:
1. Match the user's request
2. Fit within the available free time slots
3. Are appropriate for the weather
4. Consider their schedules (e.g., suggest relaxing activities if they have exams)
"""

        # Get date ideas from Claude
        ideas = self.claude.generate_ideas(claude_prompt)

        # Find real places for each idea using Google Places
        events = []
        for idea in ideas.get("ideas", [])[:5]:
            place = self.google.find_place(f"{idea} in {request.location}")

            # Pick a good time slot for this event
            suggested_slot = free_slots[0] if free_slots else None

            event = Event(
                name=place.get("name", idea),
                reason=f"A great place for '{idea}'.",
                suggested_time=suggested_slot['start'] if suggested_slot else None
            )
            events.append(event)

        return DatePlanResponse(
            events=events,
            free_time_slots=free_slots[:10]  # Include top 10 free slots
        )

    def _get_user_couple(self, user_id: UUID) -> dict:
        """Get couple record for a user."""
        # Check if user is partner1
        result = self.db.table('couples')\
            .select('*')\
            .eq('partner1_id', str(user_id))\
            .execute()

        if result.data:
            return result.data[0]

        # Check if user is partner2
        result = self.db.table('couples')\
            .select('*')\
            .eq('partner2_id', str(user_id))\
            .execute()

        if result.data:
            return result.data[0]

        return None

    def _format_free_slots(self, slots: List[Dict]) -> str:
        """Format free time slots for AI prompt."""
        if not slots:
            return "No free time available"

        lines = []
        for i, slot in enumerate(slots, 1):
            start = datetime.fromisoformat(slot['start'].replace('Z', '+00:00'))
            duration = slot['duration_hours']
            lines.append(f"{i}. {start.strftime('%A, %B %d at %I:%M %p')} ({duration:.1f} hours available)")

        return "\n".join(lines)


def get_date_generator_service(
    claude_client: ClaudeClient = Depends(get_claude_client),
    google_client: GoogleClient = Depends(get_google_client),
    weather_client: WeatherClient = Depends(get_weather_client),
    calendar_client: GoogleCalendarClient = Depends(get_calendar_client),
) -> DateGeneratorService:
    """Dependency provider for the DateGeneratorService."""
    return DateGeneratorService(
        claude_client,
        google_client,
        weather_client,
        calendar_client
    )
