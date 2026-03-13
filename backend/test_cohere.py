#!/usr/bin/env python3
"""
Test Cohere embeddings and LLM functionality
"""

import asyncio
from app.services.embedding_service import embedding_service
from app.services.rag_pipeline import rag_pipeline

async def test_cohere_functionality():
    """Test Cohere embeddings and LLM"""
    print("🧪 Testing Cohere functionality...")
    
    try:
        # Test embedding generation
        print("\n1. Testing embedding generation...")
        test_text = "This is a test document about artificial intelligence."
        embedding = await embedding_service.generate_embedding(test_text)
        print(f"✅ Generated embedding with {len(embedding)} dimensions")
        
        # Test query embedding
        print("\n2. Testing query embedding...")
        query = "What is artificial intelligence?"
        query_embedding = await embedding_service.generate_query_embedding(query)
        print(f"✅ Generated query embedding with {len(query_embedding)} dimensions")
        
        # Test batch embeddings
        print("\n3. Testing batch embeddings...")
        texts = [
            "Machine learning is a subset of AI.",
            "Deep learning uses neural networks.",
            "Natural language processing handles text."
        ]
        batch_embeddings = await embedding_service.generate_batch_embeddings(texts)
        print(f"✅ Generated {len(batch_embeddings)} batch embeddings")
        
        print("\n🎉 All Cohere tests passed!")
        print(f"📊 Embedding dimension: {len(embedding)}")
        print("🚀 Ready to process documents with Cohere!")
        
    except Exception as e:
        print(f"❌ Cohere test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_cohere_functionality())