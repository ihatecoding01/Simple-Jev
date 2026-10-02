from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional
import os

_BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Simple Jev Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Jev API config
    JEV_API_KEY: Optional[str] = None
    JEV_API_URL: str = "https://api.typesafe.ai/v1"
    
    # LLM Generator config
    LLM_PROVIDER: str = "mock"  # "gemini", "groq", "openai", "mock"
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GROQ_TEMPERATURE: float = 0.1
    OPENAI_API_KEY: Optional[str] = None
    
    # Thresholds: Recalibrated empirically against sentence-transformers (all-MiniLM-L6-v2, 384d).
    # Empirical measurements on realistic customer support & incident triage paraphrase benchmarks show:
    # 1. Verbatim & near-exact syntactic variations (case, trailing punct, polite prefixes like "Can you please..."): 0.9462 - 1.0000.
    # 2. Strong semantic paraphrases with matching intent & options (e.g. "classify customer support message into billing, tech support..."): 0.8063 - 0.8440.
    # 3. Domain-specific structural paraphrases: 0.6907 - 0.7450.
    # 4. Out-of-scope task divergence in same domain (e.g. sentiment analysis vs email routing): 0.4292.
    # 5. Cross-domain task collision (incident urgency vs customer email router): 0.2878.
    # 6. Completely unrelated general knowledge queries: -0.1019 - 0.0456.
    #
    # Economic rationale:
    # - CACHE_SIMILARITY_THRESHOLD = 0.74 allows valid semantic paraphrases (scoring 0.75-0.85) to reuse approved schemas (0 credit cost)
    #   while preserving a safe margin above cross-task false positives (< 0.57).
    # - EXACT_CACHE_THRESHOLD = 0.88 enables near-verbatim requests (>= 0.94) to execute straight through in Unrestricted Mode without
    #   prematurely auto-executing looser semantic paraphrases (which stay safely below 0.85 and require user review).
    CACHE_SIMILARITY_THRESHOLD: float = 0.74
    EXACT_CACHE_THRESHOLD: float = 0.88
    MAX_RETRY_ATTEMPTS: int = 3
    DAILY_INQUIRY_LIMIT: int = 25
    
    # Server config
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    class Config:
        env_file = [str(_BASE_DIR / ".env"), ".env", "backend/.env"]
        extra = "allow"

settings = Settings()
