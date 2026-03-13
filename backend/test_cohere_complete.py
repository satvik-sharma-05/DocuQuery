"""
Complete test script for Cohere integration
Tests embedding service and RAG pipeline
"""
import asyncio
from app.services.embedding_service import embedding_service
from app.services.rag_pipeline import rag_pipeline
from app.core.config import settings

async def test_embedding_service():
    """Test embedding generation"""
    print("\n=== Testing Embedding Service ===")
    
    test_text = "This is a test document about artificial intelligence."
    
    try:
        # Test single embedding
        embedding = await embedding_service.generate_embedding(test_text)
        print(f"✓ Generated embedding with dimension: {len(embedding)}")
        print(f"✓ Expected dimension: {settings.EMBEDDING_DIMENSION}")
        assert len(embedding) == settings.EMBEDDING_DIMENSION, "Embedding dimension mismatch!"
        
        # Test query embedding
        query_embedding = await embedding_service.generate_query_embedding("What is AI?")
        print(f"✓ Generated query embedding with dimension: {len(query_embedding)}")
        
        # Test batch embeddings
        batch_texts = [
            "First document",
            "Second document",
            "Third document"
        ]
        batch_embeddings = await embedding_service.generate_batch_embeddings(batch_texts)
        print(f"✓ Generated {len(batch_embeddings)} batch embeddings")
        
        print("\n✅ All embedding tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Embedding test failed: {str(e)}")
        return False

async def test_rag_pipeline():
    """Test RAG pipeline initialization"""
    print("\n=== Testing RAG Pipeline ===")
    
    try:
        print(f"✓ RAG pipeline initialized with model: {rag_pipeline.llm_model}")
        print(f"✓ Top K results: {rag_pipeline.top_k}")
        print(f"✓ Embedding dimension: {rag_pipeline.embedding_dimension}")
        
        print("\n✅ RAG pipeline tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ RAG pipeline test failed: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("COHERE INTEGRATION TEST SUITE")
    print("=" * 60)
    
    print(f"\nConfiguration:")
    print(f"  - API Key: {'SET' if settings.COHERE_API_KEY else 'NOT SET'}")
    print(f"  - LLM Model: {settings.LLM_MODEL}")
    print(f"  - Embedding Model: {settings.EMBEDDING_MODEL}")
    print(f"  - Embedding Dimension: {settings.EMBEDDING_DIMENSION}")
    
    # Run tests
    embedding_ok = await test_embedding_service()
    rag_ok = await test_rag_pipeline()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Embedding Service: {'✅ PASS' if embedding_ok else '❌ FAIL'}")
    print(f"RAG Pipeline: {'✅ PASS' if rag_ok else '❌ FAIL'}")
    
    if embedding_ok and rag_ok:
        print("\n🎉 All tests passed! Cohere integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
