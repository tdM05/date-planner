from app.config import settings
from ._base import AbstractClient


class RealClaudeClient(AbstractClient):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate_ideas(self, prompt: str) -> dict:
        # In a real implementation, this would make an HTTP request to the Claude API.
        print("--- Calling Real Claude API ---")
        return {"ideas": ["Real Italian Restaurant", "Real Anime Movie", "Real Park Walk"]}


class MockClaudeClient(AbstractClient):
    def generate_ideas(self, prompt: str) -> dict:
        print("--- Returning Mock Claude Data ---")
        return {"ideas": ["Mock Italian Restaurant", "Mock Anime Movie", "Mock Park Walk"]}


def get_claude_client() -> AbstractClient:
    """
    Dependency provider for the Claude client.
    Returns a real or mock client based on the environment settings.
    """
    if settings.is_development:
        return MockClaudeClient()
    return RealClaudeClient(api_key=settings.anthropic_api_key)
