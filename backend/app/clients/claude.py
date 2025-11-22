import anthropic
from typing import List, Dict
from app.config import settings
from ._base import AbstractClient


class RealClaudeClient(AbstractClient):
    """Real Claude API client using Anthropic's SDK."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-5"

    def generate_ideas(self, prompt: str, max_ideas: int = 3) -> dict:
        """
        Generate multiple date idea CONCEPTS (not specific venues yet).

        Args:
            prompt: Formatted prompt with couple's schedules, location, weather, and preferences
            max_ideas: Maximum number of ideas to generate (default 3)

        Returns:
            dict with 'ideas' key containing list of date idea concepts
            Format: {"ideas": [{"activity_type": "...", "concept": "...", "search_query": "..."}, ...]}
        """
        print(f"--- Calling Real Claude API (generating {max_ideas} date ideas) ---")

        # Define the tool for generating multiple date ideas
        ideas_tool = {
            "name": "generate_date_ideas",
            "description": f"Generates {max_ideas} diverse date idea concepts for a couple based on their schedules and preferences.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "ideas": {
                        "type": "array",
                        "description": f"List of exactly {max_ideas} diverse date idea concepts",
                        "items": {
                            "type": "object",
                            "properties": {
                                "activity_type": {
                                    "type": "string",
                                    "description": "The category of activity (e.g., 'Restaurant', 'Movie', 'Outdoor Activity', 'Bar', 'Museum')",
                                },
                                "concept": {
                                    "type": "string",
                                    "description": "Brief description of the date idea (e.g., 'Cozy Italian restaurant', 'Anime movie screening', 'Evening park walk')",
                                },
                                "search_query": {
                                    "type": "string",
                                    "description": "Google search query to find this type of venue (e.g., 'Italian restaurant', 'movie theater showing anime', 'park')",
                                },
                            },
                            "required": ["activity_type", "concept", "search_query"],
                        },
                        "minItems": max_ideas,
                        "maxItems": max_ideas,
                    }
                },
                "required": ["ideas"],
            },
        }

        system_prompt = (
            "You are a world-class relationship planner. "
            f"Your goal is to generate exactly {max_ideas} diverse, creative date idea CONCEPTS (not specific venues). "
            "Consider the couple's schedules, weather, and preferences. "
            f"You must use the provided `generate_date_ideas` tool and return exactly {max_ideas} different ideas."
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
                tools=[ideas_tool],
                tool_choice={"type": "tool", "name": "generate_date_ideas"},
            )

            # Extract the tool use response
            if response.stop_reason == "tool_use":
                tool_call = response.content[0]
                if tool_call.type == "tool_use":
                    ideas_data = tool_call.input
                    return ideas_data  # Returns {"ideas": [...]}

            # Fallback if tool use fails
            return {"ideas": []}

        except Exception as e:
            print(f"Error calling Claude API: {e}")
            return {"ideas": []}

    def pick_best_venue(
        self, idea_concept: str, venue_options: List[dict], weather: str, user_context: str
    ) -> dict:
        """
        Pick the best specific venue from Google Places results for a date idea.

        Args:
            idea_concept: The date idea concept (e.g., "Cozy Italian restaurant")
            venue_options: List of venues from Google Places API
            weather: Weather forecast information
            user_context: Context about the couple's schedules

        Returns:
            dict with selected venue info: {selected_venue_name, suggested_time, explanation}
            Returns None if selection fails
        """
        print(f"--- Calling Real Claude API (picking best venue for '{idea_concept}') ---")

        if not venue_options:
            return None

        # Define the tool for picking best venue
        pick_venue_tool = {
            "name": "select_best_venue",
            "description": "Selects the best venue from available options and explains why it's perfect for this couple.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "selected_venue_name": {
                        "type": "string",
                        "description": "Name of the chosen venue from the provided options",
                    },
                    "suggested_time": {
                        "type": "string",
                        "description": "Suggested date and time for this activity (e.g., 'Saturday, 11/16 at 7:30 PM')",
                    },
                    "explanation": {
                        "type": "string",
                        "description": "Compelling explanation for why this venue and time are perfect for the couple",
                    },
                },
                "required": ["selected_venue_name", "suggested_time", "explanation"],
            },
        }

        # Format venue options for Claude
        venues_text = "\n".join(
            [
                f"{i+1}. {v.get('name', 'Unknown')} - {v.get('address', 'No address')} (Rating: {v.get('rating', 'N/A')})"
                for i, v in enumerate(venue_options[:5])  # Limit to top 5
            ]
        )

        prompt = f"""
Date Idea: {idea_concept}
Weather: {weather}
Couple's Context: {user_context}

Available Venue Options:
{venues_text}

Pick the best venue from the options above and suggest a good time for this date.
"""

        system_prompt = (
            "You are a relationship planner helping choose the perfect venue. "
            "Select the best option from the provided venues and explain why it's ideal. "
            "You must use the `select_best_venue` tool."
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
                tools=[pick_venue_tool],
                tool_choice={"type": "tool", "name": "select_best_venue"},
            )

            if response.stop_reason == "tool_use":
                tool_call = response.content[0]
                if tool_call.type == "tool_use":
                    return tool_call.input  # Returns {selected_venue_name, suggested_time, explanation}

            return None

        except Exception as e:
            print(f"Error calling Claude API: {e}")
            return None

    def pick_top_events(
        self, all_venue_options: List[dict], num_events: int, weather: str, user_context: str,
        free_slots: List[dict] = None
    ) -> List[dict]:
        """
        Pick the top N date events from ALL collected venue options.
        More efficient than calling pick_best_venue multiple times.

        Args:
            all_venue_options: List of all venues with their idea context
                Format: [{"venue": {...}, "idea_concept": "...", "activity_type": "..."}, ...]
            num_events: Number of top events to return (e.g., 3)
            weather: Weather forecast information
            user_context: Context about the couple's schedules
            free_slots: List of available free time slots with start/end times

        Returns:
            List of selected events: [{"venue_name": "...", "suggested_time": "...", "explanation": "..."}, ...]
        """
        print(f"--- Calling Real Claude API (picking top {num_events} events from {len(all_venue_options)} total venues) ---")

        if not all_venue_options:
            return []

        # Define the tool for picking top events
        pick_events_tool = {
            "name": "select_top_events",
            "description": f"Selects the top {num_events} date events from all available venue options.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "events": {
                        "type": "array",
                        "description": f"The top {num_events} selected date events",
                        "items": {
                            "type": "object",
                            "properties": {
                                "venue_name": {
                                    "type": "string",
                                    "description": "Name of the selected venue from the provided options",
                                },
                                "suggested_time": {
                                    "type": "string",
                                    "description": "Suggested date and time for this event (MUST be selected from the available free time slots provided)",
                                },
                                "explanation": {
                                    "type": "string",
                                    "description": "Compelling explanation for why this event is perfect",
                                },
                            },
                            "required": ["venue_name", "suggested_time", "explanation"],
                        },
                        "minItems": num_events,
                        "maxItems": num_events,
                    }
                },
                "required": ["events"],
            },
        }

        # Format all venue options for Claude
        venues_text = []
        for i, option in enumerate(all_venue_options, 1):
            venue = option["venue"]
            concept = option.get("idea_concept", "Unknown")
            activity = option.get("activity_type", "Unknown")
            venues_text.append(
                f"{i}. [{activity}] {venue.get('name', 'Unknown')} - {concept}\n"
                f"   Address: {venue.get('address', 'N/A')}\n"
                f"   Rating: {venue.get('rating', 'N/A')}"
            )

        venues_formatted = "\n\n".join(venues_text)

        # Format free slots
        free_slots_text = ""
        if free_slots:
            slots_formatted = []
            for slot in free_slots:
                slots_formatted.append(f"  - {slot['start']} to {slot['end']}")
            free_slots_text = f"\n\nAvailable Free Time Slots:\n" + "\n".join(slots_formatted)
            free_slots_text += f"\n\nIMPORTANT: You MUST pick suggested_time values that fall within these free time slots ONLY. Do NOT suggest times outside these slots."

        prompt = f"""
Weather: {weather}
Couple's Context: {user_context}
{free_slots_text}

All Available Venue Options ({len(all_venue_options)} total):
{venues_formatted}

Select the top {num_events} most suitable date events from the options above.
Consider variety (different types of activities), ratings, and how well they fit the weather and couple's context.
For each event, pick a suggested_time from the available free time slots that best fits the activity type.
"""

        system_prompt = (
            f"You are a relationship planner selecting the best {num_events} date events. "
            "Choose venues that offer variety and are well-suited to the couple. "
            f"You must use the `select_top_events` tool to return exactly {num_events} events."
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
                tools=[pick_events_tool],
                tool_choice={"type": "tool", "name": "select_top_events"},
            )

            if response.stop_reason == "tool_use":
                tool_call = response.content[0]
                if tool_call.type == "tool_use":
                    result = tool_call.input
                    return result.get("events", [])

            return []

        except Exception as e:
            print(f"Error calling Claude API: {e}")
            return []


class MockClaudeClient(AbstractClient):
    """Mock Claude client for development/testing."""

    def generate_ideas(self, prompt: str, max_ideas: int = 3) -> dict:
        """Generate mock date idea concepts."""
        print(f"--- Returning Mock Claude Data ({max_ideas} ideas) ---")
        return {
            "ideas": [
                {
                    "activity_type": "Restaurant",
                    "concept": "Cozy Italian restaurant",
                    "search_query": "Italian restaurant",
                },
                {
                    "activity_type": "Movie",
                    "concept": "Anime movie screening",
                    "search_query": "movie theater",
                },
                {
                    "activity_type": "Outdoor Activity",
                    "concept": "Evening park walk",
                    "search_query": "park",
                },
            ][:max_ideas]  # Return only the requested number of ideas
        }

    def pick_best_venue(
        self, idea_concept: str, venue_options: List[dict], weather: str, user_context: str
    ) -> dict:
        """Pick mock best venue from options."""
        print(f"--- Mock: Picking best venue for '{idea_concept}' ---")
        if not venue_options:
            return None

        # Just pick the first venue for mock
        first_venue = venue_options[0]
        return {
            "selected_venue_name": first_venue.get("name", "Mock Venue"),
            "suggested_time": "Saturday, 7:00 PM",
            "explanation": f"This is a mock selection for {idea_concept}. The venue looks great!",
        }

    def pick_top_events(
        self, all_venue_options: List[dict], num_events: int, weather: str, user_context: str,
        free_slots: List[dict] = None
    ) -> List[dict]:
        """Pick mock top events from all venue options."""
        print(f"--- Mock: Picking top {num_events} events from {len(all_venue_options)} venues ---")

        if not all_venue_options:
            return []

        # Just pick the first N venues for mock
        selected_events = []
        for i, option in enumerate(all_venue_options[:num_events]):
            venue = option["venue"]
            selected_events.append({
                "venue_name": venue.get("name", f"Mock Venue {i+1}"),
                "suggested_time": f"Day {i+1}, 7:00 PM",
                "explanation": f"Mock selection: This {option.get('activity_type', 'venue')} looks perfect!",
            })

        return selected_events


def get_claude_client() -> AbstractClient:
    """
    Factory function to get Claude client.
    Returns real or mock client based on USE_REAL_CLAUDE setting.
    """
    if settings.use_real_claude:
        return RealClaudeClient(api_key=settings.anthropic_api_key)
    return MockClaudeClient()
