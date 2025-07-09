#!/usr/bin/env python3
"""
VISTA AI Cybersecurity Platform - Backend Startup Script
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def main():
    """Main startup function"""
    
    # Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        print("⚠️  Warning: .env file not found. Using default configuration.")
        print("   Copy env.example to .env and configure your settings.")
    
    # Create necessary directories
    uploads_dir = Path(__file__).parent / "uploads"
    models_dir = Path(__file__).parent / "models"
    
    uploads_dir.mkdir(exist_ok=True)
    models_dir.mkdir(exist_ok=True)
    
    print("🚀 Starting VISTA AI Cybersecurity Platform Backend...")
    print(f"📁 Upload directory: {uploads_dir}")
    print(f"🤖 Models directory: {models_dir}")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main() 