import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Simple settings class without pydantic dependency issues"""
    
    # App Config
    APP_NAME = os.getenv("APP_NAME", "DocuQuery")
    APP_ENV = os.getenv("APP_ENV", "development")
    APP_PORT = int(os.getenv("APP_PORT", "8000"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
    
    # Cohere AI
    COHERE_API_KEY = os.getenv("COHERE_API_KEY")
    LLM_MODEL = os.getenv("LLM_MODEL", "command-a-03-2025")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "embed-english-v3.0")
    EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1024"))
    
    # RAG Settings
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))
    TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "5"))
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2000"))
    
    # File Upload
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
    ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", "pdf,docx,txt,md").split(",")
    SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "documents")
    
    # Slack
    SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID", "")
    SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET", "")
    SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET", "")
    SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")

settings = Settings()