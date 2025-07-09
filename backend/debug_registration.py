#!/usr/bin/env python3
"""
Debug script for registration issue
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, Base, engine
from app.models.database import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy import text

def test_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_table_creation():
    """Test if tables exist"""
    print("\n🔍 Testing table creation...")
    try:
        # Import all models to ensure they are registered
        from app.models.database import User, AnalysisResult, SecurityLog, Alert, SystemMetrics, ModelPerformance, AuditLog, FileUpload, ThreatIntelligence
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Table creation failed: {e}")
        return False

def test_user_creation():
    """Test user creation directly"""
    print("\n🔍 Testing user creation...")
    try:
        db = SessionLocal()
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "debug@test.com").first()
        if existing_user:
            print("✅ User already exists")
            db.close()
            return True
        
        # Create new user
        hashed_password = get_password_hash("debugpassword123")
        new_user = User(
            email="debug@test.com",
            password_hash=hashed_password,
            full_name="Debug User",
            company_name="Debug Company",
            role=UserRole.ANALYST,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✅ User created successfully with ID: {new_user.id}")
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ User creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_password_hashing():
    """Test password hashing"""
    print("\n🔍 Testing password hashing...")
    try:
        from app.core.security import get_password_hash, verify_password
        
        password = "testpassword123"
        hashed = get_password_hash(password)
        is_valid = verify_password(password, hashed)
        
        print(f"✅ Password hashing works: {is_valid}")
        return True
    except Exception as e:
        print(f"❌ Password hashing failed: {e}")
        return False

def main():
    """Run all debug tests"""
    print("🚀 Starting Registration Debug Tests")
    print("=" * 50)
    
    # Test each component
    db_ok = test_database_connection()
    tables_ok = test_table_creation()
    password_ok = test_password_hashing()
    user_ok = test_user_creation()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Debug Results:")
    print(f"Database Connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"Table Creation: {'✅ PASS' if tables_ok else '❌ FAIL'}")
    print(f"Password Hashing: {'✅ PASS' if password_ok else '❌ FAIL'}")
    print(f"User Creation: {'✅ PASS' if user_ok else '❌ FAIL'}")
    
    if all([db_ok, tables_ok, password_ok, user_ok]):
        print("\n🎉 All components working! Registration should work.")
    else:
        print("\n⚠️  Some components failed. Check the output above.")

if __name__ == "__main__":
    main() 