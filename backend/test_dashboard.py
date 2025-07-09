#!/usr/bin/env python3
"""
Test dashboard endpoints
"""

import requests
import json

def test_dashboard_endpoints():
    # First, register and login to get a token
    base_url = "http://localhost:8000/api/v1"
    
    # Register a test user
    user_data = {
        "email": f"dashboard_test{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "Dashboard Test User",
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
    
    # Test dashboard endpoints
    endpoints = [
        ("/dashboard/metrics", "System Metrics"),
        ("/dashboard/threats", "Threat Summary"),
        ("/dashboard/performance", "Performance Metrics"),
        ("/dashboard/activity", "Activity Timeline")
    ]
    
    print("\n3. Testing dashboard endpoints...")
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: {json.dumps(data, indent=2)}")
            else:
                print(f"❌ {name} failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ {name} error: {e}")
    
    print("\n🎉 Dashboard endpoints test completed!")

if __name__ == "__main__":
    import time
    test_dashboard_endpoints() 