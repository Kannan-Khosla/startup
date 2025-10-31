"""Configuration management using Pydantic Settings for type-safe config."""
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings with validation."""

    # Required settings
    openai_api_key: str = Field(..., description="OpenAI API key")
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_key: str = Field(..., description="Supabase anon key")

    # Optional settings with defaults
    admin_token: Optional[str] = Field(default=None, description="Admin token for protected endpoints")
    ai_reply_window_seconds: int = Field(default=60, description="Rate limit window in seconds")
    ai_reply_max_per_window: int = Field(default=2, description="Max AI replies per window")
    log_level: str = Field(default="INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR)")
    
    # Retry configuration
    openai_max_retries: int = Field(default=3, description="Max retry attempts for OpenAI API calls")
    openai_initial_delay: float = Field(default=0.5, description="Initial retry delay in seconds")
    openai_backoff_multiplier: float = Field(default=2.0, description="Backoff multiplier for retries")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("ai_reply_window_seconds", "ai_reply_max_per_window", "openai_max_retries")
    @classmethod
    def validate_positive_integers(cls, v: int) -> int:
        """Ensure positive integers for numeric settings."""
        if v <= 0:
            raise ValueError(f"Value must be positive, got {v}")
        return v

    @field_validator("openai_initial_delay", "openai_backoff_multiplier")
    @classmethod
    def validate_positive_floats(cls, v: float) -> float:
        """Ensure positive floats for delay settings."""
        if v <= 0:
            raise ValueError(f"Value must be positive, got {v}")
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"Log level must be one of {valid_levels}, got {v}")
        return v_upper


def get_settings() -> Settings:
    """Get application settings, validating on first call."""
    try:
        return Settings()
    except Exception as e:
        logger.error(f"Failed to load settings: {e}")
        raise ValueError(
            f"Configuration error: {e}. "
            "Please ensure all required environment variables are set: "
            "OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY"
        ) from e


# Global settings instance
settings = get_settings()

