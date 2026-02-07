"""
Environment configuration with validation.
"""
import os
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration from environment variables."""

    # Required
    gemini_api_key: str

    # Optional with defaults
    db_path: str = "wondercomic.db"
    frontend_url: str = "http://localhost:3000"
    debug_mode: bool = False


def validate_environment() -> Config:
    """
    Validate required environment variables and return config.

    Raises:
        ValueError: If required environment variables are missing.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError(
            "Missing required environment variables:\n  - GEMINI_API_KEY is required"
        )

    return Config(
        gemini_api_key=gemini_api_key,
        db_path=os.getenv("DB_PATH", "wondercomic.db"),
        frontend_url=os.getenv("FRONTEND_URL", "http://localhost:3000"),
        debug_mode=os.getenv("DEBUG", "").lower() in ("true", "1", "yes"),
    )


# Singleton config instance (validated on import)
_config: Config | None = None


def get_config() -> Config:
    """Get validated config, validating on first call."""
    global _config
    if _config is None:
        _config = validate_environment()
    return _config


def safe_error_detail(e: Exception, fallback: str = "Internal server error") -> str:
    """Return full error in debug mode, generic message in production."""
    if get_config().debug_mode:
        return str(e)
    return fallback
