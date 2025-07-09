#!/usr/bin/env python3
"""
Test registration endpoint
"""

import requests
import json
import time

def test_registration():
    url = "http://localhost:8000/api/v1/auth/register"
    
    user_data = {
        "email": f"test{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Testing registration...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(user_data, indent=2)}")
        
        response = requests.post(url, json=user_data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Registration successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print("❌ Registration failed!")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Backend not running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_registration() 