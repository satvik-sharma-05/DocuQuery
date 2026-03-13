#!/usr/bin/env python3
"""Test document upload endpoint"""

import requests
import io

# Step 1: Login
print("Step 1: Logging in...")
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={
        "email": "satviksharma@gmail.com",
        "password": "satvik"
    }
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
workspace_id = login_response.json()["workspaces"][0]["id"]
print(f"✓ Logged in successfully")
print(f"✓ Workspace ID: {workspace_id}")

# Step 2: Upload document
print("\nStep 2: Uploading document...")
test_content = b"This is a test document about quantum computing. Quantum computers use qubits to perform calculations."

files = {
    'file': ('test_quantum.txt', io.BytesIO(test_content), 'text/plain')
}
data = {
    'description': 'Test document about quantum computing'
}
headers = {
    'Authorization': f'Bearer {token}',
    'X-Workspace-ID': workspace_id
}

upload_response = requests.post(
    "http://localhost:8000/api/documents/upload",
    files=files,
    data=data,
    headers=headers
)

print(f"Upload status: {upload_response.status_code}")
if upload_response.status_code == 200:
    print(f"✓ Document uploaded successfully!")
    print(f"Response: {upload_response.json()}")
else:
    print(f"✗ Upload failed: {upload_response.text}")

# Step 3: List documents
print("\nStep 3: Listing documents...")
list_response = requests.get(
    "http://localhost:8000/api/documents/",
    headers=headers
)

if list_response.status_code == 200:
    docs = list_response.json()
    print(f"✓ Found {len(docs)} documents")
    for doc in docs:
        print(f"  - {doc['name']}: {doc['chunk_count']} chunks")
else:
    print(f"✗ Failed to list documents: {list_response.text}")
