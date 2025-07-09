#!/usr/bin/env python3
"""
Simple test script for VISTA Backend
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_root():
    """Test root endpoint"""
    print("\n🔍 Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_register():
    """Test user registration"""
    print("\n🔍 Testing user registration...")
    user_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_login():
    """Test user login"""
    print("\n🔍 Testing user login...")
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print(f"Access Token: {token_data['access_token'][:50]}...")
        return token_data['access_token']
    else:
        print(f"Response: {response.json()}")
        return None

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    if not token:
        print("\n❌ No token available, skipping protected endpoint test")
        return False
    
    print("\n🔍 Testing protected endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def main():
    """Run all tests"""
    print("🚀 Starting VISTA Backend Tests")
    print("=" * 50)
    
    # Test basic endpoints
    health_ok = test_health()
    root_ok = test_root()
    
    # Test authentication
    register_ok = test_register()
    token = test_login()
    protected_ok = test_protected_endpoint(token)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Health Endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Root Endpoint: {'✅ PASS' if root_ok else '❌ FAIL'}")
    print(f"User Registration: {'✅ PASS' if register_ok else '❌ FAIL'}")
    print(f"User Login: {'✅ PASS' if token else '❌ FAIL'}")
    print(f"Protected Endpoint: {'✅ PASS' if protected_ok else '❌ FAIL'}")
    
    if all([health_ok, root_ok, register_ok, token, protected_ok]):
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")

if __name__ == "__main__":
    main() 