from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_ENV: str = "development"

    # External API Keys
    anthropic_api_key: str = Field(..., alias="ANTHROPIC_API_KEY")
    google_api_key: str = Field(..., alias="GOOGLE_MAPS_API_KEY")
    weather_api_key: str = Field(..., alias="OPENWEATHER_API_KEY")

    # Supabase Configuration
    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_key: str = Field(..., alias="SUPABASE_KEY")

    # Google OAuth Configuration
    google_client_id: str = Field(..., alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(..., alias="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(
        default="http://localhost:8000/api/v1/auth/google/callback",
        alias="GOOGLE_REDIRECT_URI"
    )

    # JWT Configuration
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expiration_minutes: int = Field(default=10080, alias="JWT_EXPIRATION_MINUTES")  # 7 days

    # API Mock/Real Configuration
    # Set to True to use real APIs (costs money), False for free mock data
    use_real_claude: bool = Field(default=False, alias="USE_REAL_CLAUDE")
    use_real_google_places: bool = Field(default=False, alias="USE_REAL_GOOGLE_PLACES")
    use_real_weather: bool = Field(default=False, alias="USE_REAL_WEATHER")
    use_real_google_calendar: bool = Field(default=False, alias="USE_REAL_GOOGLE_CALENDAR")

    # Development/Testing Configuration
    disable_auth_in_dev: bool = Field(default=False, alias="DISABLE_AUTH_IN_DEV")
    test_user_id: str = Field(default="82240440-3508-41d3-8eb4-b5de91095249", alias="TEST_USER_ID")

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
