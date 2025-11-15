from app.config import settings
from ._base import AbstractClient


class RealWeatherClient(AbstractClient):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_weather(self, location: str, time_frame: str) -> dict:
        # In a real implementation, this would make an HTTP request to a weather API.
        print(f"--- Calling Real Weather API for {location} in {time_frame} ---")
        return {"forecast": "Sunny"}


class MockWeatherClient(AbstractClient):
    def get_weather(self, location: str, time_frame: str) -> dict:
        print(f"--- Returning Mock Weather Data for {location} in {time_frame} ---")
        return {"forecast": "Always Sunny in Mockland"}


def get_weather_client() -> AbstractClient:
    """
    Dependency provider for the Weather client.
    Returns a real or mock client based on the environment settings.
    """
    if settings.is_development:
        return MockWeatherClient()
    return RealWeatherClient(api_key=settings.weather_api_key)
