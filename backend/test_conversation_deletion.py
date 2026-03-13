import asyncio
import requests
import json

async def test_conversation_deletion():
    """Test conversation deletion endpoint"""
    
    base_url = "http://localhost:8000"
    
    # Test credentials
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        # Login to get token
        print("Logging in...")
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return
            
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get conversations
        print("Fetching conversations...")
        conv_response = requests.get(f"{base_url}/api/chat/conversations", headers=headers)
        
        if conv_response.status_code != 200:
            print(f"Failed to fetch conversations: {conv_response.status_code} - {conv_response.text}")
            return
            
        conversations = conv_response.json()
        print(f"Found {len(conversations)} conversations")
        
        if not conversations:
            print("No conversations to delete")
            return
            
        # Try to delete the first conversation
        conversation_id = conversations[0]["id"]
        print(f"Attempting to delete conversation: {conversation_id}")
        
        delete_response = requests.delete(f"{base_url}/api/chat/conversations/{conversation_id}", headers=headers)
        
        if delete_response.status_code == 200:
            print("✅ Conversation deleted successfully!")
            print(f"Response: {delete_response.json()}")
        else:
            print(f"❌ Failed to delete conversation: {delete_response.status_code} - {delete_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_conversation_deletion())