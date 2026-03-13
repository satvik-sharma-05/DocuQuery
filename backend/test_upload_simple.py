import asyncio
import httpx
import os

async def test_upload():
    # Login first
    login_response = await httpx.AsyncClient().post(
        "http://localhost:8000/api/auth/login",
        json={
            "email": "satviksharma@gmail.com",
            "password": "satvik"
        }
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    print(f"Logged in successfully")
    
    # Create a test file
    test_content = b"This is a test document about quantum computing. Quantum computers use qubits."
    
    # Upload document
    async with httpx.AsyncClient() as client:
        files = {"file": ("test.txt", test_content, "text/plain")}
        data = {"description": "Test document about quantum computing"}
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.post(
            "http://localhost:8000/api/documents/upload",
            files=files,
            data=data,
            headers=headers,
            timeout=30.0
        )
        
        print(f"Upload status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_upload())
