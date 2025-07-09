#!/usr/bin/env python3
"""
Test 20GB file upload functionality
"""

import requests
import json
import time
import os
import tempfile

def create_large_test_file(filename, size_gb=1):
    """Create a large test file (default 1GB for testing)"""
    size_bytes = size_gb * 1024 * 1024 * 1024
    chunk_size = 1024 * 1024  # 1MB chunks
    
    print(f"Creating {size_gb}GB test file: {filename}")
    print("This may take a while...")
    
    with open(filename, 'wb') as f:
        written = 0
        while written < size_bytes:
            # Write in 1MB chunks to avoid memory issues
            chunk_size_actual = min(chunk_size, size_bytes - written)
            chunk = b"X" * chunk_size_actual
            f.write(chunk)
            written += chunk_size_actual
            
            # Progress indicator
            if written % (100 * 1024 * 1024) == 0:  # Every 100MB
                progress = (written / size_bytes) * 100
                print(f"Progress: {progress:.1f}% ({written / (1024**3):.1f}GB written)")
    
    print(f"✅ Created test file: {filename} ({size_gb}GB)")

def test_20gb_upload():
    # First, register and login to get a token
    base_url = "http://localhost:8000/api/v1"
    
    # Register a test user
    user_data = {
        "email": f"20gb_test{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "20GB Upload Test User",
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
    
    # Create large test file (1GB for testing, adjust as needed)
    print("\n3. Creating large test file...")
    test_filename = "large_1gb_test.log"
    create_large_test_file(test_filename, size_gb=1)  # 1GB file for testing
    
    # Test streaming upload
    print("\n4. Testing streaming upload...")
    try:
        with open(test_filename, 'rb') as f:
            files = {"file": (test_filename, f, "text/plain")}
            data = {"upload_type": "text"}
            
            print("Starting streaming upload...")
            start_time = time.time()
            
            response = requests.post(
                f"{base_url}/logs/upload-streaming",
                files=files,
                data=data,
                headers=headers,
                stream=True  # Enable streaming
            )
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                upload_time = end_time - start_time
                file_size_gb = 1
                speed_gbps = (file_size_gb * 8) / upload_time  # Convert to Gbps
                
                print(f"✅ Streaming upload successful: {result}")
                print(f"📊 Upload time: {upload_time:.2f} seconds")
                print(f"📊 Upload speed: {speed_gbps:.2f} Gbps")
                print(f"📊 File size: {result.get('file_size_gb', 'N/A')}GB")
            else:
                print(f"❌ Streaming upload failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Streaming upload error: {e}")
    
    # Test resume functionality
    print("\n5. Testing resume functionality...")
    try:
        # Create a partial file
        partial_filename = "partial_test.log"
        with open(partial_filename, 'wb') as f:
            f.write(b"Partial content " * 1000000)  # ~15MB
        
        # Try to resume
        resume_data = {"upload_id": "test_resume_id"}
        response = requests.post(
            f"{base_url}/logs/upload-resume",
            data=resume_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Resume check successful: {result}")
        else:
            print(f"❌ Resume check failed: {response.status_code} - {response.text}")
            
        # Clean up partial file
        os.remove(partial_filename)
        
    except Exception as e:
        print(f"❌ Resume test error: {e}")
    
    # Clean up test file
    print("\n6. Cleaning up test file...")
    try:
        os.remove(test_filename)
        print("✅ Test file cleaned up")
    except:
        pass
    
    print("\n🎉 20GB upload test completed!")
    print("\n💡 For actual 20GB files:")
    print("   - Use streaming upload for files > 1GB")
    print("   - Ensure stable network connection")
    print("   - Monitor disk space (need 20GB+ free)")
    print("   - Consider using resume functionality for reliability")

if __name__ == "__main__":
    test_20gb_upload() 