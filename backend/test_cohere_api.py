"""
Test Cohere API connectivity and embedding generation
"""
import asyncio
import sys
from app.core.config import settings
from app.services.embedding_service import embedding_service

async def test_cohere_api():
    """Test Cohere API connection and embedding generation"""
    print("\n" + "="*60)
    print("COHERE API TEST")
    print("="*60)
    
    # Check configuration
    print("\n1. Configuration Check:")
    print(f"   API Key: {'SET' if settings.COHERE_API_KEY else 'NOT SET'}")
    if settings.COHERE_API_KEY:
        print(f"   API Key (first 10 chars): {settings.COHERE_API_KEY[:10]}...")
    print(f"   Embedding Model: {settings.EMBEDDING_MODEL}")
    print(f"   Embedding Dimension: {settings.EMBEDDING_DIMENSION}")
    
    if not settings.COHERE_API_KEY:
        print("\n❌ ERROR: COHERE_API_KEY is not set in .env file")
        return False
    
    # Test simple embedding
    print("\n2. Testing Simple Embedding:")
    test_text = "This is a test document."
    
    try:
        print(f"   Generating embedding for: '{test_text}'")
        embedding = await embedding_service.generate_embedding(test_text)
        print(f"   ✓ Success! Generated {len(embedding)} dimensional vector")
        print(f"   ✓ First 5 values: {embedding[:5]}")
        
        if len(embedding) != settings.EMBEDDING_DIMENSION:
            print(f"   ⚠️  WARNING: Expected {settings.EMBEDDING_DIMENSION}d but got {len(embedding)}d")
            return False
            
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test query embedding
    print("\n3. Testing Query Embedding:")
    test_query = "What is this about?"
    
    try:
        print(f"   Generating query embedding for: '{test_query}'")
        query_embedding = await embedding_service.generate_query_embedding(test_query)
        print(f"   ✓ Success! Generated {len(query_embedding)} dimensional vector")
        
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test batch embeddings
    print("\n4. Testing Batch Embeddings:")
    test_texts = [
        "First document chunk",
        "Second document chunk",
        "Third document chunk"
    ]
    
    try:
        print(f"   Generating embeddings for {len(test_texts)} texts...")
        batch_embeddings = await embedding_service.generate_batch_embeddings(test_texts)
        print(f"   ✓ Success! Generated {len(batch_embeddings)} embeddings")
        
        for i, emb in enumerate(batch_embeddings):
            print(f"   ✓ Embedding {i+1}: {len(emb)} dimensions")
            
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test PostgreSQL format
    print("\n5. Testing PostgreSQL Vector Format:")
    try:
        embedding_str = "[" + ",".join(map(str, embedding[:10])) + ",...]"
        print(f"   ✓ Format: {embedding_str}")
        print(f"   ✓ Can convert to string format")
        
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)}")
        return False
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print("\nCohere API is working correctly.")
    print("If document upload still fails, check backend logs for details.")
    print("\n")
    
    return True

if __name__ == "__main__":
    result = asyncio.run(test_cohere_api())
    sys.exit(0 if result else 1)
