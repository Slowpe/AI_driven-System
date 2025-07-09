from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import structlog
from app.core.config import settings

logger = structlog.get_logger()

# Create SQLAlchemy engine
if settings.ENVIRONMENT == "test":
    # Use in-memory SQLite for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
elif "sqlite" in settings.DATABASE_URL.lower():
    # Use SQLite for development
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # Use PostgreSQL for production
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database dependency
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize database tables"""
    try:
        # Import all models to ensure they are registered
        from app.models.database import User, AnalysisResult, SecurityLog, Alert, SystemMetrics, ModelPerformance, AuditLog, FileUpload, ThreatIntelligence
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Create initial admin user if not exists
        db = SessionLocal()
        try:
            from app.core.security import get_password_hash
            from app.models.database import User
            
            admin_user = db.query(User).filter(User.email == "admin@vista.com").first()
            if not admin_user:
                admin_user = User(
                    email="admin@vista.com",
                    password_hash=get_password_hash("admin123"),
                    full_name="System Administrator",
                    company_name="VISTA Security",
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                logger.info("Initial admin user created")
        except Exception as e:
            logger.error("Error creating admin user", error=str(e))
        finally:
            db.close()
            
    except Exception as e:
        logger.error("Database initialization failed", error=str(e))
        raise 