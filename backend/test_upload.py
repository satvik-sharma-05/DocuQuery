import requests

def test_upload():
    """Test document upload endpoint"""
    
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
        
        # Create a test file
        print("\n2. Testing document upload...")
        
        # Create a simple text file
        test_content = b"This is a test document for upload testing."
        
        files = {
            'file': ('test_document.txt', test_content, 'text/plain')
        }
        
        data = {
            'description': 'Test document upload'
        }
        
        upload_response = requests.post(
            f"{base_url}/api/documents/upload",
            headers=headers,
            files=files,
            data=data
        )
        
        print(f"Upload status: {upload_response.status_code}")
        if upload_response.status_code == 200:
            print("Upload successful!")
            print(f"Response: {upload_response.json()}")
        else:
            print(f"Upload failed: {upload_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_upload()