#!/usr/bin/env python3
"""Complete RAG system test"""
import requests
import io
import time

BASE_URL = "http://localhost:8000"

def test_full_system():
    print("=" * 70)
    print("COMPLETE RAG SYSTEM TEST")
    print("=" * 70)
    
    # Step 1: Login
    print("\n[1/5] Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "satviksharma@gmail.com", "password": "satvik"}
    )
    
    if login_response.status_code != 200:
        print(f"✗ Login failed: {login_response.text}")
        return False
    
    data = login_response.json()
    token = data["access_token"]
    workspace_id = data["user"]["workspace_id"]
    print(f"✓ Logged in successfully")
    print(f"  Workspace: {workspace_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Workspace-ID": workspace_id
    }
    
    # Step 2: Upload document
    print("\n[2/5] Uploading document...")
    test_content = b"Quantum computing uses qubits. Qubits can be in superposition."
    
    files = {"file": ("test_quantum.txt", io.BytesIO(test_content), "text/plain")}
    data = {"description": "Test document about quantum computing"}
    
    upload_response = requests.post(
        f"{BASE_URL}/api/documents/upload",
        files=files,
        data=data,
        headers=headers
    )
    
    if upload_response.status_code != 200:
        print(f"✗ Upload failed: {upload_response.text}")
        return False
    
    doc = upload_response.json()
    doc_id = doc["id"]
    print(f"✓ Document uploaded: {doc['name']}")
    print(f"  ID: {doc_id}")
    
    # Wait for background processing
    print("\n[3/5] Waiting for chunk processing (10 seconds)...")
    time.sleep(10)
    
    # Step 4: List documents
    print("\n[4/5] Listing documents...")
    list_response = requests.get(f"{BASE_URL}/api/documents/", headers=headers)
    
    if list_response.status_code != 200:
        print(f"✗ List failed: {list_response.text}")
        return False
    
    docs = list_response.json()
    print(f"✓ Found {len(docs)} documents")
    for d in docs:
        print(f"  - {d['name']}: {d['chunk_count']} chunks")
    
    # Step 5: Test RAG query
    print("\n[5/5] Testing RAG query...")
    query_response = requests.post(
        f"{BASE_URL}/api/chat/query",
        json={"query": "What is quantum computing?"},
        headers=headers
    )
    
    if query_response.status_code != 200:
        print(f"✗ Query failed: {query_response.text}")
        return False
    
    result = query_response.json()
    print(f"✓ Query successful")
    print(f"\nAnswer: {result['answer'][:200]}...")
    print(f"Sources: {len(result['sources'])}")
    
    print("\n" + "=" * 70)
    print("ALL TESTS PASSED ✓")
    print("=" * 70)
    return True

if __name__ == "__main__":
    test_full_system()
