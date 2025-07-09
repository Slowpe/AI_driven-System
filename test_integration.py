#!/usr/bin/env python3
"""
Test script to verify frontend-backend integration
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE_URL = f"{BASE_URL}/api/v1"

def test_backend_health():
    """Test if backend is running"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start the backend first.")
        return False

def test_registration():
    """Test user registration"""
    print("\n🔍 Testing user registration...")
    user_data = {
        "email": "test@vista.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/register", json=user_data)
        if response.status_code == 200:
            print("✅ Registration successful")
            return user_data
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None

def test_login(user_data):
    """Test user login"""
    print("\n🔍 Testing user login...")
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful")
            return token_data["access_token"]
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_protected_endpoint(token):
    """Test accessing a protected endpoint"""
    print("\n🔍 Testing protected endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user_info = response.json()
            print(f"✅ Protected endpoint accessible - User: {user_info['full_name']}")
            return True
        else:
            print(f"❌ Protected endpoint failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")
        return False

def test_analysis_endpoints(token):
    """Test analysis endpoints"""
    print("\n🔍 Testing analysis endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Test getting analysis results
        response = requests.get(f"{API_BASE_URL}/analysis/results", headers=headers)
        if response.status_code == 200:
            results = response.json()
            print(f"✅ Analysis results endpoint accessible - {len(results)} results")
            return True
        else:
            print(f"❌ Analysis results failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Analysis endpoints error: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Starting Frontend-Backend Integration Tests")
    print("=" * 60)
    
    # Test backend health
    if not test_backend_health():
        print("\n❌ Backend is not available. Please start the backend first.")
        return
    
    # Test registration
    user_data = test_registration()
    if not user_data:
        print("\n❌ Registration failed. Cannot continue with other tests.")
        return
    
    # Test login
    token = test_login(user_data)
    if not token:
        print("\n❌ Login failed. Cannot continue with other tests.")
        return
    
    # Test protected endpoints
    if not test_protected_endpoint(token):
        print("\n❌ Protected endpoint test failed.")
        return
    
    # Test analysis endpoints
    if not test_analysis_endpoints(token):
        print("\n❌ Analysis endpoints test failed.")
        return
    
    print("\n" + "=" * 60)
    print("🎉 All integration tests passed!")
    print("\n📋 Summary:")
    print("✅ Backend is running and healthy")
    print("✅ User registration works")
    print("✅ User login works")
    print("✅ JWT authentication works")
    print("✅ Protected endpoints are accessible")
    print("✅ Analysis endpoints are accessible")
    print("\n🚀 Your frontend should now be able to connect to the backend!")
    print("\n💡 Next steps:")
    print("1. Start your React frontend: npm run dev")
    print("2. Navigate to http://localhost:5173")
    print("3. Try registering/logging in with the test account")
    print("4. Test the log upload and analysis features")

if __name__ == "__main__":
    main() 