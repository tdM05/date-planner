"""
Google Calendar API client for fetching user calendar events.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from uuid import UUID

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from app.config import settings
from app.clients.db import get_db


class GoogleCalendarClient:
    """Client for interacting with Google Calendar API."""

    def __init__(self):
        self.db = get_db()

    def _get_credentials(self, user_id: UUID) -> Optional[Credentials]:
        """
        Get Google OAuth credentials for a user from database.

        Args:
            user_id: User's UUID

        Returns:
            Google Credentials object or None if user has no token
        """
        # Fetch user's refresh token from database
        result = self.db.table('users')\
            .select('google_refresh_token')\
            .eq('id', str(user_id))\
            .execute()

        if not result.data or not result.data[0].get('google_refresh_token'):
            return None

        refresh_token = result.data[0]['google_refresh_token']

        # Create credentials object
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=['https://www.googleapis.com/auth/calendar.readonly']
        )

        # Refresh the access token
        if not credentials.valid:
            credentials.refresh(Request())

        return credentials

    def get_events(
        self,
        user_id: UUID,
        time_min: datetime,
        time_max: datetime
    ) -> List[Dict]:
        """
        Fetch calendar events for a user within a time range.

        Args:
            user_id: User's UUID
            time_min: Start of time range
            time_max: End of time range

        Returns:
            List of calendar events with start, end, and summary

        Raises:
            ValueError: If user has no calendar access token
        """
        credentials = self._get_credentials(user_id)
        if not credentials:
            raise ValueError(f"User {user_id} has no Google Calendar access")

        # Build Calendar API service
        service = build('calendar', 'v3', credentials=credentials)

        # Call the Calendar API
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min.isoformat() + 'Z',
            timeMax=time_max.isoformat() + 'Z',
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])

        # Format events
        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))

            formatted_events.append({
                'summary': event.get('summary', 'Busy'),
                'start': start,
                'end': end,
                'description': event.get('description', '')
            })

        return formatted_events

    def find_free_slots(
        self,
        user1_id: UUID,
        user2_id: UUID,
        time_frame_start: datetime,
        time_frame_end: datetime,
        slot_duration_hours: float = 2.0
    ) -> List[Dict]:
        """
        Find mutual free time slots for two users.

        This implements the free time intersection logic from Algorithm 1
        in your pseudocode.

        Args:
            user1_id: First user's UUID
            user2_id: Second user's UUID
            time_frame_start: Start of search period
            time_frame_end: End of search period
            slot_duration_hours: Minimum duration of free slots in hours

        Returns:
            List of free time slots with start and end times
        """
        # Get events for both users
        user1_events = self.get_events(user1_id, time_frame_start, time_frame_end)
        user2_events = self.get_events(user2_id, time_frame_start, time_frame_end)

        # Combine all busy times
        busy_times = []

        for event in user1_events + user2_events:
            start = datetime.fromisoformat(event['start'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(event['end'].replace('Z', '+00:00'))
            busy_times.append((start, end))

        # Sort busy times by start time
        busy_times.sort(key=lambda x: x[0])

        # Find free slots
        free_slots = []
        current_time = time_frame_start

        for busy_start, busy_end in busy_times:
            # If there's a gap between current_time and busy_start
            if current_time < busy_start:
                slot_duration = (busy_start - current_time).total_seconds() / 3600
                if slot_duration >= slot_duration_hours:
                    free_slots.append({
                        'start': current_time.isoformat(),
                        'end': busy_start.isoformat(),
                        'duration_hours': slot_duration
                    })

            # Move current_time to end of this busy period
            if busy_end > current_time:
                current_time = busy_end

        # Check for free time after last busy period
        if current_time < time_frame_end:
            slot_duration = (time_frame_end - current_time).total_seconds() / 3600
            if slot_duration >= slot_duration_hours:
                free_slots.append({
                    'start': current_time.isoformat(),
                    'end': time_frame_end.isoformat(),
                    'duration_hours': slot_duration
                })

        return free_slots

    def get_events_context(
        self,
        user_id: UUID,
        time_frame_start: datetime,
        time_frame_end: datetime
    ) -> str:
        """
        Get calendar events formatted as context for AI model.

        Includes event names and descriptions so the AI can factor in
        things like exams or important meetings when suggesting dates.

        Args:
            user_id: User's UUID
            time_frame_start: Start of time range
            time_frame_end: End of time range

        Returns:
            Formatted string describing the user's schedule
        """
        events = self.get_events(user_id, time_frame_start, time_frame_end)

        if not events:
            return "No scheduled events in this time period."

        context_lines = ["Scheduled events:"]
        for event in events:
            start = event['start']
            summary = event['summary']
            description = event.get('description', '')

            line = f"- {start}: {summary}"
            if description:
                line += f" ({description})"
            context_lines.append(line)

        return "\n".join(context_lines)


def get_calendar_client() -> GoogleCalendarClient:
    """Dependency function to get GoogleCalendarClient instance."""
    return GoogleCalendarClient()
