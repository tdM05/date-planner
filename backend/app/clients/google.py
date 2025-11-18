import googlemaps
from typing import Optional, Dict
from app.config import settings
from ._base import AbstractClient


class RealGoogleClient(AbstractClient):
    """Real Google Places API client using googlemaps SDK."""

    def __init__(self, api_key: str):
        self.client = googlemaps.Client(key=api_key)

    def find_place(self, query: str, max_results: int = 5) -> list:
        """
        Find multiple places using Google Places Text Search API.

        Args:
            query: Search query (e.g., "Cozy romantic Italian restaurant in Little Italy, Toronto")
            max_results: Maximum number of results to return (default 5)

        Returns:
            list of dicts with place details: [{name, place_id, address, coordinates, rating}, ...]
        """
        print(f"--- Calling Real Google Places API for query: {query} (max {max_results} results) ---")

        try:
            # Use text search to find places matching the query
            search_results = self.client.places(query=query)

            # Check if we got results
            if search_results['status'] == 'OK' and search_results['results']:
                places = []

                # Get top N results (up to max_results)
                for result in search_results['results'][:max_results]:
                    # Extract location coordinates
                    location = result.get('geometry', {}).get('location', {})

                    place = {
                        "name": result.get('name', 'Unknown'),
                        "place_id": result.get('place_id'),
                        "address": result.get('formatted_address', 'Address not available'),
                        "lat": location.get('lat'),
                        "lon": location.get('lng'),
                        "rating": result.get('rating'),
                        "types": result.get('types', [])
                    }
                    places.append(place)

                print(f"Found {len(places)} places")
                return places
            else:
                print(f"No results found. Status: {search_results.get('status')}")
                return []

        except Exception as e:
            print(f"Error calling Google Places API: {e}")
            return []


class MockGoogleClient(AbstractClient):
    """Mock Google Places client for development/testing."""

    def find_place(self, query: str, max_results: int = 5) -> list:
        """Return mock list of places."""
        print(f"--- Returning Mock Google Places Data for query: {query} ({max_results} results) ---")

        # Return 3 mock venues for testing
        mock_places = [
            {
                "name": "Mock Romantic Restaurant A",
                "place_id": "mock_place_id_001",
                "address": "123 Main Street, Mock City",
                "lat": 40.7128,
                "lon": -74.0060,
                "rating": 4.7,
                "types": ["restaurant", "food"]
            },
            {
                "name": "Mock Romantic Restaurant B",
                "place_id": "mock_place_id_002",
                "address": "456 Second Ave, Mock City",
                "lat": 40.7589,
                "lon": -73.9851,
                "rating": 4.5,
                "types": ["restaurant", "food", "fine_dining"]
            },
            {
                "name": "Mock Romantic Restaurant C",
                "place_id": "mock_place_id_003",
                "address": "789 Third Blvd, Mock City",
                "lat": 40.7306,
                "lon": -73.9352,
                "rating": 4.3,
                "types": ["restaurant", "food", "italian"]
            },
        ]

        return mock_places[:max_results]


def get_google_client() -> AbstractClient:
    """
    Factory function to get Google Places client.
    Returns real or mock client based on USE_REAL_GOOGLE_PLACES setting.
    """
    if settings.use_real_google_places:
        return RealGoogleClient(api_key=settings.google_api_key)
    return MockGoogleClient()
