from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
import uuid

from app.core.database import Base

class ThreatLevel(enum.Enum):
    NORMAL = "normal"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserRole(enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    company_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.ANALYST)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    logs = relationship("SecurityLog", back_populates="user")
    analysis_results = relationship("AnalysisResult", back_populates="user")

class SecurityLog(Base):
    __tablename__ = "security_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, nullable=False, index=True)
    source = Column(String(100), nullable=False)
    log_type = Column(String(50), nullable=False)
    raw_message = Column(Text, nullable=False)
    parsed_data = Column(JSON)
    severity = Column(Enum(ThreatLevel), default=ThreatLevel.NORMAL)
    processed = Column(Boolean, default=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    user_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="logs")
    analysis_results = relationship("AnalysisResult", back_populates="log")
    alerts = relationship("Alert", back_populates="log")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    log_id = Column(String, ForeignKey("security_logs.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    model_name = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    prediction = Column(Enum(ThreatLevel), nullable=False)
    features = Column(JSON)
    processing_time = Column(Float)  # seconds
    model_version = Column(String(50))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    log = relationship("SecurityLog", back_populates="analysis_results")
    user = relationship("User", back_populates="analysis_results")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    severity = Column(Enum(ThreatLevel), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    log_id = Column(String, ForeignKey("security_logs.id"))
    analysis_result_id = Column(String, ForeignKey("analysis_results.id"))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    log = relationship("SecurityLog", back_populates="alerts")
    analysis_result = relationship("AnalysisResult")

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=func.now(), index=True)
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    disk_usage = Column(Float)
    network_in = Column(Float)
    network_out = Column(Float)
    active_connections = Column(Integer)
    requests_per_second = Column(Float)
    error_rate = Column(Float)

class ModelPerformance(Base):
    __tablename__ = "model_performance"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=func.now(), index=True)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    false_positive_rate = Column(Float)
    processing_time_avg = Column(Float)
    total_predictions = Column(Integer)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    timestamp = Column(DateTime, default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")

class FileUpload(Base):
    __tablename__ = "file_uploads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100))
    upload_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    processing_result = Column(JSON)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    processed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User")

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    indicator = Column(String(255), nullable=False, index=True)  # IP, domain, hash, etc.
    indicator_type = Column(String(50), nullable=False)  # ip, domain, hash, url
    threat_type = Column(String(100))
    confidence = Column(Float)
    source = Column(String(100))
    first_seen = Column(DateTime, default=func.now())
    last_seen = Column(DateTime, default=func.now())
    tags = Column(JSON)
    threat_metadata = Column(JSON)
    is_active = Column(Boolean, default=True) 