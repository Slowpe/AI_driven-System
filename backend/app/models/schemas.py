from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    role: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class AnalysisRequest(BaseModel):
    log_ids: List[str]

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    message: Optional[str] = None
    log_count: Optional[int] = None
    estimated_time: Optional[str] = None
    total_results: Optional[int] = None
    completed_results: Optional[int] = None
    average_confidence: Optional[float] = None
    threat_distribution: Optional[dict] = None

class AnalysisResultResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    id: str
    log_id: str
    model_name: str
    confidence_score: float
    prediction: str
    processing_time: Optional[float] = None
    model_version: Optional[str] = None
    created_at: datetime

class BatchAnalysisRequest(BaseModel):
    log_ids: List[str] 