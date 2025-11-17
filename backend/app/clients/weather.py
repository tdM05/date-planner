import requests
from typing import Optional
from app.config import settings
from ._base import AbstractClient


class RealWeatherClient(AbstractClient):
    """Real OpenWeatherMap API client."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"

    def get_weather(self, location: str = None, time_frame: str = None, lat: float = None, lon: float = None) -> dict:
        """
        Get weather forecast using OpenWeatherMap API.

        Args:
            location: Location string (legacy parameter, not used with real API)
            time_frame: Time frame string (legacy parameter, not used with real API)
            lat: Latitude coordinate
            lon: Longitude coordinate

        Returns:
            dict with weather forecast information
        """
        # Use lat/lon if provided, otherwise fall back to default coordinates
        if lat is None or lon is None:
            print("--- Warning: No coordinates provided, using default location ---")
            lat, lon = 40.7128, -74.0060  # Default to NYC

        print(f"--- Calling Real Weather API for coordinates ({lat}, {lon}) ---")

        try:
            # Use the forecast endpoint for 5-day forecast
            url = f"{self.base_url}/forecast?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"

            response = requests.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()

            # Extract and format the forecast
            if data.get('list'):
                forecasts = []
                for item in data['list'][:8]:  # Get next 24 hours (8 x 3-hour periods)
                    forecasts.append({
                        "datetime": item.get('dt_txt'),
                        "temp": item['main'].get('temp'),
                        "feels_like": item['main'].get('feels_like'),
                        "description": item['weather'][0].get('description') if item.get('weather') else 'Unknown',
                        "humidity": item['main'].get('humidity'),
                        "wind_speed": item['wind'].get('speed')
                    })

                return {
                    "forecast": self._format_forecast(forecasts),
                    "details": forecasts,
                    "location": data.get('city', {}).get('name', 'Unknown')
                }

            return {"forecast": "No forecast data available"}

        except requests.exceptions.RequestException as e:
            print(f"Error calling Weather API: {e}")
            return {"forecast": f"Error: {str(e)}"}
        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"forecast": f"Error: {str(e)}"}

    def _format_forecast(self, forecasts: list) -> str:
        """Format forecast data into readable string."""
        if not forecasts:
            return "No forecast available"

        summary_parts = []
        for fc in forecasts[:3]:  # Show first 3 periods
            summary_parts.append(
                f"{fc['datetime']}: {fc['description'].capitalize()}, {fc['temp']:.1f}°C"
            )

        return "; ".join(summary_parts)


class MockWeatherClient(AbstractClient):
    """Mock Weather client for development/testing."""

    def get_weather(self, location: str = None, time_frame: str = None, lat: float = None, lon: float = None) -> dict:
        loc_str = f"{location}" if location else f"coordinates ({lat}, {lon})"
        print(f"--- Returning Mock Weather Data for {loc_str} ---")

        return {
            "forecast": "Friday night: Clear, 45°F; Saturday: Rain, 55°F; Sunday: Cloudy, 50°F",
            "details": [
                {"datetime": "Friday 6:00 PM", "temp": 7, "feels_like": 5, "description": "clear sky", "humidity": 65, "wind_speed": 3.5},
                {"datetime": "Saturday 12:00 PM", "temp": 13, "feels_like": 11, "description": "light rain", "humidity": 85, "wind_speed": 5.2},
                {"datetime": "Sunday 3:00 PM", "temp": 10, "feels_like": 8, "description": "overcast clouds", "humidity": 75, "wind_speed": 4.1}
            ],
            "location": "Mock City"
        }


def get_weather_client() -> AbstractClient:
    """
    Factory function to get Weather client.
    Returns real or mock client based on USE_REAL_WEATHER setting.
    """
    if settings.use_real_weather:
        return RealWeatherClient(api_key=settings.weather_api_key)
    return MockWeatherClient()
