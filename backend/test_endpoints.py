import requests
import json

def test_endpoints():
    """Test the problematic endpoints"""
    
    base_url = "http://localhost:8000"
    
    # Login first
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        print("1. Logging in...")
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
            
        login_result = login_response.json()
        token = login_result["access_token"]
        workspace_id = login_result["user"]["workspace_id"]
        
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Workspace-ID": workspace_id
        }
        
        print(f"Logged in successfully. Workspace ID: {workspace_id}")
        
        # Test analytics dashboard
        print("\n2. Testing analytics dashboard...")
        analytics_response = requests.get(f"{base_url}/api/analytics/dashboard", headers=headers)
        print(f"Analytics dashboard status: {analytics_response.status_code}")
        if analytics_response.status_code != 200:
            print(f"Analytics error: {analytics_response.text}")
        else:
            print("Analytics dashboard working!")
            
        # Test analytics time-series
        print("\n3. Testing analytics time-series...")
        timeseries_response = requests.get(f"{base_url}/api/analytics/time-series?days=30", headers=headers)
        print(f"Time-series status: {timeseries_response.status_code}")
        if timeseries_response.status_code != 200:
            print(f"Time-series error: {timeseries_response.text}")
        else:
            print("Time-series working!")
            
        # Test invitations
        print("\n4. Testing invitations...")
        invitations_response = requests.get(f"{base_url}/api/invitations/pending", headers=headers)
        print(f"Invitations status: {invitations_response.status_code}")
        if invitations_response.status_code != 200:
            print(f"Invitations error: {invitations_response.text}")
        else:
            print("Invitations working!")
            
        # Test chat conversations
        print("\n5. Testing chat conversations...")
        chat_response = requests.get(f"{base_url}/api/chat/conversations", headers=headers)
        print(f"Chat status: {chat_response.status_code}")
        if chat_response.status_code != 200:
            print(f"Chat error: {chat_response.text}")
        else:
            print("Chat working!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoints()