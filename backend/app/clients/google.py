from app.config import settings
from ._base import AbstractClient


class RealGoogleClient(AbstractClient):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def find_place(self, query: str) -> dict:
        # In a real implementation, this would make an HTTP request to the Google Places API.
        print(f"--- Calling Real Google Places API for query: {query} ---")
        return {"name": f"Real Place for {query}", "address": "123 Real St"}


class MockGoogleClient(AbstractClient):
    def find_place(self, query: str) -> dict:
        print(f"--- Returning Mock Google Places Data for query: {query} ---")
        return {"name": f"Mock Place for {query}", "address": "123 Mock St"}


def get_google_client() -> AbstractClient:
    """
    Dependency provider for the Google client.
    Returns a real or mock client based on the environment settings.
    """
    if settings.is_development:
        return MockGoogleClient()
    return RealGoogleClient(api_key=settings.google_api_key)
