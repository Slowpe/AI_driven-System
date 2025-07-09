#!/usr/bin/env python3
"""
Test upload endpoints
"""

import requests
import json
import time
import os

def test_upload_endpoints():
    # First, register and login to get a token
    base_url = "http://localhost:8000/api/v1"
    
    # Register a test user
    user_data = {
        "email": f"upload_test{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "Upload Test User",
        "company_name": "Test Company"
    }
    
    print("1. Registering test user...")
    response = requests.post(f"{base_url}/auth/register", json=user_data)
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.text}")
        return
    
    print("✅ User registered successfully")
    
    # Login to get token
    print("\n2. Logging in...")
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    
    response = requests.post(f"{base_url}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    token_data = response.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Create test files
    print("\n3. Creating test files...")
    
    # Create a test text file
    test_text_content = """
[2024-01-15 10:30:15] WARNING: Failed login attempt from IP 192.168.1.100
[2024-01-15 10:30:16] INFO: User admin logged in successfully
[2024-01-15 10:31:20] ERROR: Database connection timeout
[2024-01-15 10:32:45] WARNING: High CPU usage detected: 85%
"""
    
    with open("test_log.txt", "w") as f:
        f.write(test_text_content)
    
    # Test single file upload
    print("\n4. Testing single file upload...")
    try:
        with open("test_log.txt", "rb") as f:
            files = {"file": ("test_log.txt", f, "text/plain")}
            data = {"upload_type": "text"}
            response = requests.post(
                f"{base_url}/logs/upload",
                files=files,
                data=data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Single file upload successful: {result}")
            else:
                print(f"❌ Single file upload failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Single file upload error: {e}")
    
    # Test multiple files upload
    print("\n5. Testing multiple files upload...")
    try:
        # Create another test file
        test_csv_content = "timestamp,event,severity\n2024-01-15 10:30:15,login_failed,warning\n2024-01-15 10:30:16,login_success,info"
        with open("test_data.csv", "w") as f:
            f.write(test_csv_content)
        
        with open("test_log.txt", "rb") as f1, open("test_data.csv", "rb") as f2:
            files = [
                ("files", ("test_log.txt", f1, "text/plain")),
                ("files", ("test_data.csv", f2, "text/csv"))
            ]
            data = {"upload_type": "text"}
            response = requests.post(
                f"{base_url}/logs/upload-folder",
                files=files,
                data=data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Multiple files upload successful: {result}")
            else:
                print(f"❌ Multiple files upload failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Multiple files upload error: {e}")
    
    # Clean up test files
    print("\n6. Cleaning up test files...")
    try:
        os.remove("test_log.txt")
        os.remove("test_data.csv")
        print("✅ Test files cleaned up")
    except:
        pass
    
    print("\n🎉 Upload endpoints test completed!")

if __name__ == "__main__":
    test_upload_endpoints() 