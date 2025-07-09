#!/usr/bin/env python3
"""
Test chunked upload functionality
"""

import requests
import json
import time
import os

def create_large_test_file(filename, size_mb=10):
    """Create a large test file"""
    size_bytes = size_mb * 1024 * 1024
    with open(filename, 'wb') as f:
        # Write repeating pattern to create a large file
        chunk = b"Test log data " * 1000  # ~14KB chunk
        chunks_needed = size_bytes // len(chunk)
        
        for i in range(chunks_needed):
            f.write(chunk)
        
        # Write remaining bytes
        remaining = size_bytes % len(chunk)
        if remaining > 0:
            f.write(chunk[:remaining])
    
    print(f"Created test file: {filename} ({size_mb}MB)")

def test_chunked_upload():
    # First, register and login to get a token
    base_url = "http://localhost:8000/api/v1"
    
    # Register a test user
    user_data = {
        "email": f"chunked_test{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "Chunked Upload Test User",
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
    
    # Create large test file
    print("\n3. Creating large test file...")
    test_filename = "large_test_file.log"
    create_large_test_file(test_filename, size_mb=10)  # 10MB file
    
    # Test chunked upload
    print("\n4. Testing chunked upload...")
    try:
        with open(test_filename, 'rb') as f:
            files = {"file": (test_filename, f, "text/plain")}
            data = {"upload_type": "text"}
            
            start_time = time.time()
            response = requests.post(
                f"{base_url}/logs/upload",
                files=files,
                data=data,
                headers=headers
            )
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                upload_time = end_time - start_time
                file_size_mb = 10
                speed_mbps = file_size_mb / upload_time
                
                print(f"✅ Chunked upload successful: {result}")
                print(f"📊 Upload time: {upload_time:.2f} seconds")
                print(f"📊 Upload speed: {speed_mbps:.2f} MB/s")
            else:
                print(f"❌ Chunked upload failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Chunked upload error: {e}")
    
    # Clean up test file
    print("\n5. Cleaning up test file...")
    try:
        os.remove(test_filename)
        print("✅ Test file cleaned up")
    except:
        pass
    
    print("\n🎉 Chunked upload test completed!")

if __name__ == "__main__":
    test_chunked_upload() 