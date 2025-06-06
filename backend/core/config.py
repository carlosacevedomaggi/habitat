from pydantic_settings import BaseSettings
import os
from typing import Optional
from pathlib import Path

# Load .env file if present (using python-dotenv implicitly via Pydantic)
# from dotenv import load_dotenv
# load_dotenv()

# Determine project root (two levels up from this file)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Habitat API"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    # Base URL for constructing full URLs (e.g., for emails, static files)
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000") 

    # Database Settings (PostgreSQL example)
    # Default to SQLite for easy local development; override with PostgreSQL via env var
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{str(BASE_DIR / 'habitat_api.db')}"
    )
    # Example PostgreSQL: postgresql+psycopg2://user:password@localhost/habitatdb

    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_in_env")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # Default: 30 minutes

    # CORS Origins (adjust as needed for production)
    # Example: BACKEND_CORS_ORIGINS="http://localhost:3000,https://your-frontend-domain.com"
    BACKEND_CORS_ORIGINS: list[str] = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

    # Upload Directory (if handling uploads locally)
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "backend/static/uploads")

    # Email Settings (SMTP)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None # Optional: if you want a specific sender email

    # Old Email Settings (commented out, can be removed if not used)
    # MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    # MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    # MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    # MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    # MAIL_SERVER: str = os.getenv("MAIL_SERVER", "")
    # MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() in ("true", "1", "t")
    # MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() in ("true", "1", "t")

    class Config:
        # Load .env from project root
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = 'utf-8'
        case_sensitive = True

# Instantiate the settings
settings = Settings() 