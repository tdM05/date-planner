from datetime import datetime, timedelta
from typing import List, Dict
from uuid import UUID
from fastapi import Depends

from app.clients.claude import get_claude_client, RealClaudeClient, MockClaudeClient
from app.clients.google import get_google_client, RealGoogleClient, MockGoogleClient
from app.clients.weather import get_weather_client, RealWeatherClient, MockWeatherClient
from app.clients.google_calendar import (
    get_calendar_client,
    RealGoogleCalendarClient,
    MockGoogleCalendarClient,
)
from app.clients.db import get_db
from app.core.models import (
    DateGenerationRequest,
    CoupleeDateGenerationRequest,
    DatePlanResponse,
    Event,
)
from app.utils.couple import get_user_couple, get_partner_id
from ._base import AbstractService

# Using the real classes for type hinting improves editor support.
ClaudeClient = RealClaudeClient | MockClaudeClient
GoogleClient = RealGoogleClient | MockGoogleClient
WeatherClient = RealWeatherClient | MockWeatherClient
CalendarClient = RealGoogleCalendarClient | MockGoogleCalendarClient


class DateGeneratorService(AbstractService):
    def __init__(
        self,
        claude_client: ClaudeClient,
        google_client: GoogleClient,
        weather_client: WeatherClient,
        calendar_client: CalendarClient | None = None,
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
                reason=f"A great place for '{idea}'.",
            )
            events.append(event)

        return DatePlanResponse(events=events)

    def generate_couple_date_plan(
        self, user_id: UUID, request: CoupleeDateGenerationRequest
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
        # Check if user has connected their Google Calendar
        user_result = self.db.table('users').select('google_refresh_token', 'full_name').eq('id', str(user_id)).execute()
        if not user_result.data or not user_result.data[0].get('google_refresh_token'):
            raise ValueError(
                "Calendar not connected. Please connect your Google Calendar first by visiting /api/v1/auth/google/login"
            )

        # Get user's name with fallback
        user1_name = user_result.data[0].get('full_name') or 'Partner 1'

        # Get user's couple relationship
        couple = get_user_couple(user_id)
        if not couple:
            raise ValueError("You must be in a couple to use this feature")

        # Get both partner IDs
        partner1_id = UUID(couple["partner1_id"])
        partner2_id = UUID(couple["partner2_id"])

        # Get partner's ID using helper function
        partner_id = get_partner_id(user_id, couple)
        partner_result = self.db.table('users').select('google_refresh_token', 'full_name').eq('id', str(partner_id)).execute()
        if not partner_result.data or not partner_result.data[0].get('google_refresh_token'):
            raise ValueError(
                "Your partner has not connected their Google Calendar yet. Both partners need to connect their calendars."
            )

        # Get partner's name with fallback
        user2_name = partner_result.data[0].get('full_name') or 'Partner 2'

        # Use provided date range from request
        time_frame_start = request.start_date
        time_frame_end = request.end_date

        # DEBUG: Log received date range
        print(f"DEBUG: Date range requested: {request.start_date} to {request.end_date}")
        print(f"DEBUG: Timezone-aware dates: {time_frame_start} to {time_frame_end}")

        # Validate date range
        if time_frame_end <= time_frame_start:
            raise ValueError("end_date must be after start_date")

        # Get free time slots for the couple (Algorithm 1)
        free_slots = self.calendar.find_free_slots(
            user1_id=partner1_id,
            user2_id=partner2_id,
            time_frame_start=time_frame_start,
            time_frame_end=time_frame_end,
            slot_duration_hours=2.0,
        )

        # DEBUG: Log free slots found
        print(f"DEBUG: Found {len(free_slots)} free slots")
        if free_slots:
            print(f"DEBUG: First slot: {free_slots[0]['start']}")
            print(f"DEBUG: Last slot: {free_slots[-1]['start']}")

        if not free_slots:
            raise ValueError("No mutual free time found in the specified time frame")

        # Get weather forecast
        days_span = (time_frame_end - time_frame_start).days
        weather_info = self.weather.get_weather(
            request.location, f"{days_span} days"
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

{user1_name}'s Schedule Context:
{user1_context}

{user2_name}'s Schedule Context:
{user2_context}

Please suggest 3 diverse date idea CONCEPTS that:
1. Match the user's request
2. Fit within the available free time slots
3. Are appropriate for the weather
4. Consider their schedules (e.g., suggest relaxing activities if they have exams)
"""

        # PHASE 1: Get date idea concepts from Claude (limited to 3)
        ideas_response = self.claude.generate_ideas(claude_prompt, max_ideas=3)
        date_ideas = ideas_response.get("ideas", [])

        if not date_ideas:
            raise ValueError("Claude did not return any date ideas")

        # PHASE 2: Collect all venues from Google Places
        context_summary = f"{user1_name}: {user1_context}\n{user2_name}: {user2_context}"
        all_venue_options = []

        for idea in date_ideas:
            # Get the search query from the idea
            search_query = idea.get("search_query", idea.get("concept", ""))
            concept = idea.get("concept", "Unknown")
            activity_type = idea.get("activity_type", "Activity")

            # Find real places using Google Places (returns list of 3-5 venues)
            venues = self.google.find_place(
                f"{search_query} in {request.location}",
                max_results=5
            )

            if not venues:
                # Skip this idea if no venues found
                print(f"No venues found for idea: {concept}")
                continue

            print(f"Found {len(venues)} venues for '{concept}'")

            # Add all venues to the collection with their context
            for venue in venues:
                all_venue_options.append({
                    "venue": venue,
                    "idea_concept": concept,
                    "activity_type": activity_type,
                })

        if not all_venue_options:
            raise ValueError("No venues found for any date ideas")

        # PHASE 3: Have Claude pick the top 3 events from ALL venues (single API call)
        print(f"Collected {len(all_venue_options)} total venues, asking Claude to pick top 3...")

        selected_events = self.claude.pick_top_events(
            all_venue_options=all_venue_options,
            num_events=3,
            weather=weather_info['forecast'],
            user_context=context_summary,
        )

        # PHASE 4: Create Event objects from Claude's selections
        events = []
        for selection in selected_events:
            # Find the venue details from all_venue_options
            selected_venue_option = next(
                (opt for opt in all_venue_options if opt["venue"].get("name") == selection["venue_name"]),
                all_venue_options[0] if all_venue_options else None  # Fallback
            )

            if selected_venue_option:
                venue = selected_venue_option["venue"]
                suggested_time = selection["suggested_time"]
                print(f"DEBUG: Claude selected suggested_time: {suggested_time} for {venue.get('name')}")
                event = Event(
                    name=venue.get("name", selection["venue_name"]),
                    reason=selection["explanation"],
                    suggested_time=suggested_time,
                )
                events.append(event)

        if not events:
            raise ValueError("No suitable venues found for any date ideas")

        return DatePlanResponse(
            events=events, free_time_slots=free_slots[:10]  # Include top 10 free slots
        )

    def _format_free_slots(self, slots: List[Dict]) -> str:
        """Format free time slots for AI prompt."""
        if not slots:
            return "No free time available"

        lines = []
        for i, slot in enumerate(slots, 1):
            start = datetime.fromisoformat(slot["start"].replace("Z", "+00:00"))
            duration = slot["duration_hours"]
            lines.append(
                f"{i}. {start.strftime('%A, %B %d at %I:%M %p')} ({duration:.1f} hours available)"
            )

        return "\n".join(lines)


def get_date_generator_service(
    claude_client: ClaudeClient = Depends(get_claude_client),
    google_client: GoogleClient = Depends(get_google_client),
    weather_client: WeatherClient = Depends(get_weather_client),
    calendar_client: CalendarClient = Depends(get_calendar_client),
) -> DateGeneratorService:
    """Dependency provider for the DateGeneratorService."""
    return DateGeneratorService(
        claude_client, google_client, weather_client, calendar_client
    )
