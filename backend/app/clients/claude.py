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


def get_claude_client() -> AbstractClient:
    """
    Factory function to get Claude client.
    Returns real or mock client based on USE_REAL_CLAUDE setting.
    """
    if settings.use_real_claude:
        return RealClaudeClient(api_key=settings.anthropic_api_key)
    return MockClaudeClient()
