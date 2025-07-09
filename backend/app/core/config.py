from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "VISTA AI Cybersecurity Platform"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database - Use SQLite for development
    DATABASE_URL: str = "sqlite:///./vista.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://vista-frontend.vercel.app"
    ]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    
    # File Upload
    MAX_FILE_SIZE: int = 25 * 1024 * 1024 * 1024  # 25GB max file size
    CHUNK_SIZE: int = 10 * 1024 * 1024  # 10MB chunks for very large files
    CHUNKED_UPLOAD_THRESHOLD: int = 50 * 1024 * 1024  # 50MB threshold for chunked upload
    STREAMING_UPLOAD_THRESHOLD: int = 1024 * 1024 * 1024  # 1GB threshold for streaming upload
    UPLOAD_DIR: str = "./uploads"
    TEMP_UPLOAD_DIR: str = "./uploads/temp"
    ALLOWED_FILE_TYPES: List[str] = [
        "text/plain",
        "text/csv",
        "application/json",
        "application/xml",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/tiff",
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",  # For binary files
        "text/html",
        "text/xml",
        "text/css",
        "application/javascript",
        "application/x-python-code",
        "application/x-python",
        "text/x-python"
    ]
    
    # AI Models
    MODEL_CACHE_DIR: str = "models"
    BERT_MODEL_NAME: str = "bert-base-uncased"
    RESNET_MODEL_PATH: str = "models/resnet_security.pth"
    ENSEMBLE_MODEL_PATH: str = "models/ensemble_security.pkl"
    
    # Monitoring
    PROMETHEUS_PORT: int = 9090
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Email (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@vista-security.com"
    
    # External APIs
    VIRUSTOTAL_API_KEY: Optional[str] = None
    ABUSEIPDB_API_KEY: Optional[str] = None
    IPQUALITYSCORE_API_KEY: Optional[str] = None
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True) 