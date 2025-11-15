"""
Supabase database client for Date Planner application.
"""
from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Singleton wrapper for Supabase client."""

    _instance: Client = None
    _initialization_failed: bool = False

    @classmethod
    def get_client(cls) -> Client:
        """
        Get or create Supabase client instance.
        Returns a singleton instance of the Supabase client.

        Raises:
            RuntimeError: If Supabase client initialization failed
        """
        if cls._initialization_failed:
            raise RuntimeError(
                "Supabase client initialization failed. "
                "Please check your SUPABASE_URL and SUPABASE_KEY environment variables."
            )

        if cls._instance is None:
            try:
                cls._instance = create_client(
                    settings.supabase_url,
                    settings.supabase_key
                )
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                cls._initialization_failed = True
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise RuntimeError(
                    f"Failed to initialize Supabase client: {e}. "
                    "Please check your SUPABASE_URL and SUPABASE_KEY in .env file."
                )
        return cls._instance


# Convenience function for getting the client
def get_db() -> Client:
    """
    Dependency function for FastAPI routes.
    Returns the Supabase client instance.

    Raises:
        RuntimeError: If Supabase client cannot be initialized
    """
    return SupabaseClient.get_client()
