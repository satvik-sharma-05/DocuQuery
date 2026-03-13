#!/usr/bin/env python3
"""
Test DOCX processing with sample content
"""

from app.services.document_processor import document_processor

# Sample content that should contain HackTrack
sample_content = """
PROJECTS     

HackTrack – AI-Powered Hackathon Platform
Live: https://hacktrack1-mu.vercel.app/
GitHub: Repository 
Tech Stack: React, Node.js, Express, MongoDB, JWT, Hugging Face, Sentence-BERT, Vector Embeddings, Vercel, Render
Built a production-grade AI platform to discover hackathons, match developers, and automatically form balanced teams using semantic embeddings.
Designed a microservices architecture with frontend on Vercel, backend on Render, MongoDB Atlas for persistence, and Hugging Face for embedding generation.
"""

def test_chunking():
    print("=== TESTING CHUNKING WITH HACKTRACK CONTENT ===\n")
    
    print("Original content:")
    print(sample_content)
    print("\n" + "="*50 + "\n")
    
    # Test chunking
    chunks = document_processor.chunk_text(sample_content)
    print(f"Created {len(chunks)} chunks:")
    
    for i, chunk in enumerate(chunks):
        print(f"\n--- CHUNK {i+1} ---")
        print(chunk)
        
        if 'hacktrack' in chunk.lower():
            print("🎯 THIS CHUNK CONTAINS HACKTRACK!")
    
    print("\n" + "="*50)
    print("SUMMARY:")
    hacktrack_found = any('hacktrack' in chunk.lower() for chunk in chunks)
    print(f"HackTrack found in chunks: {'✅ YES' if hacktrack_found else '❌ NO'}")

if __name__ == "__main__":
    test_chunking()