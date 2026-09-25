from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "Simple Jev Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Jev API config
    JEV_API_KEY: Optional[str] = None
    JEV_API_URL: str = "https://api.typesafe.ai/v1"
    
    # LLM Generator config
    LLM_PROVIDER: str = "mock"  # "gemini", "groq", "openai", "mock"
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Thresholds
    CACHE_SIMILARITY_THRESHOLD: float = 0.85
    EXACT_CACHE_THRESHOLD: float = 0.95
    MAX_RETRY_ATTEMPTS: int = 3
    DAILY_INQUIRY_LIMIT: int = 25
    
    # Server config
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
