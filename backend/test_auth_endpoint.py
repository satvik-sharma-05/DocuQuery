import requests
import json

def test_auth_flow():
    """Test the complete auth flow"""
    
    base_url = "http://localhost:8000"
    
    # Test credentials
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        print("1. Testing login endpoint...")
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        print(f"Login status: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
            
        login_result = login_response.json()
        print(f"Login successful! User: {login_result['user']['email']}")
        
        token = login_result["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\n2. Testing /api/auth/me endpoint...")
        me_response = requests.get(f"{base_url}/api/auth/me", headers=headers)
        
        print(f"Me endpoint status: {me_response.status_code}")
        if me_response.status_code == 200:
            me_result = me_response.json()
            print(f"Me endpoint successful! User: {me_result['email']}")
            print(f"Workspace: {me_result['workspace_name']}")
        else:
            print(f"Me endpoint failed: {me_response.text}")
            
        print("\n3. Testing a protected endpoint...")
        conv_response = requests.get(f"{base_url}/api/chat/conversations", headers=headers)
        
        print(f"Conversations endpoint status: {conv_response.status_code}")
        if conv_response.status_code == 200:
            conversations = conv_response.json()
            print(f"Conversations endpoint successful! Found {len(conversations)} conversations")
        else:
            print(f"Conversations endpoint failed: {conv_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_flow()