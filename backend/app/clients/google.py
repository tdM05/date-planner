import googlemaps
from typing import Optional, Dict
from app.config import settings
from ._base import AbstractClient


class RealGoogleClient(AbstractClient):
    """Real Google Places API client using googlemaps SDK."""

    def __init__(self, api_key: str):
        self.client = googlemaps.Client(key=api_key)

    def find_place(self, query: str) -> dict:
        """
        Find a place using Google Places Text Search API.

        Args:
            query: Search query (e.g., "Cozy romantic Italian restaurant in Little Italy, Toronto")

        Returns:
            dict with place details: name, place_id, address, coordinates
        """
        print(f"--- Calling Real Google Places API for query: {query} ---")

        try:
            # Use text search to find places matching the query
            search_results = self.client.places(query=query)

            # Check if we got results
            if search_results['status'] == 'OK' and search_results['results']:
                # Get the top result
                top_result = search_results['results'][0]

                # Extract location coordinates
                location = top_result.get('geometry', {}).get('location', {})

                return {
                    "name": top_result.get('name', 'Unknown'),
                    "place_id": top_result.get('place_id'),
                    "address": top_result.get('formatted_address', 'Address not available'),
                    "lat": location.get('lat'),
                    "lon": location.get('lng'),
                    "rating": top_result.get('rating'),
                    "types": top_result.get('types', [])
                }
            else:
                print(f"No results found. Status: {search_results.get('status')}")
                return {
                    "name": "No place found",
                    "place_id": None,
                    "address": "No results",
                    "lat": None,
                    "lon": None
                }

        except Exception as e:
            print(f"Error calling Google Places API: {e}")
            return {
                "name": f"Error: {str(e)}",
                "place_id": None,
                "address": "Error occurred",
                "lat": None,
                "lon": None
            }


class MockGoogleClient(AbstractClient):
    """Mock Google Places client for development/testing."""

    def find_place(self, query: str) -> dict:
        print(f"--- Returning Mock Google Places Data for query: {query} ---")
        return {
            "name": "Mock Romantic Restaurant",
            "place_id": "mock_place_id_12345",
            "address": "123 Mock Street, Mock City",
            "lat": 40.7128,  # Mock NYC coordinates
            "lon": -74.0060,
            "rating": 4.5,
            "types": ["restaurant", "food"]
        }


def get_google_client() -> AbstractClient:
    """
    Factory function to get Google Places client.
    Returns real or mock client based on USE_REAL_GOOGLE_PLACES setting.
    """
    if settings.use_real_google_places:
        return RealGoogleClient(api_key=settings.google_api_key)
    return MockGoogleClient()
