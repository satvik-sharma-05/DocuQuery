#!/usr/bin/env python3
"""
Test API endpoints
"""

import requests
import json

def test_endpoints():
    base_url = "http://localhost:8000"
    
    print("🔍 Testing API endpoints...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test docs endpoint
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"✅ Docs endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Docs endpoint failed: {e}")
    
    # Test auth login endpoint (should return 422 for missing data, not 404)
    try:
        response = requests.post(f"{base_url}/api/auth/login", json={})
        print(f"✅ Auth login endpoint exists: {response.status_code} (422 expected for missing data)")
    except Exception as e:
        print(f"❌ Auth login endpoint failed: {e}")
    
    # Test auth register endpoint
    try:
        response = requests.post(f"{base_url}/api/auth/register", json={})
        print(f"✅ Auth register endpoint exists: {response.status_code} (422 expected for missing data)")
    except Exception as e:
        print(f"❌ Auth register endpoint failed: {e}")

if __name__ == "__main__":
    test_endpoints()