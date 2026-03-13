"""
Test document upload and embedding generation
"""
import asyncio
from app.services.embedding_service import embedding_service
from app.services.document_processor import document_processor

async def test_document_processing():
    """Test the complete document processing pipeline"""
    print("\n=== Testing Document Processing Pipeline ===\n")
    
    # Sample text
    sample_text = """
    This is a test document about artificial intelligence and machine learning.
    AI has revolutionized many industries including healthcare, finance, and transportation.
    Machine learning models can learn from data and make predictions.
    Deep learning is a subset of machine learning that uses neural networks.
    """
    
    try:
        # Test chunking
        print("1. Testing text chunking...")
        chunks = document_processor.chunk_text(sample_text)
        print(f"   ✓ Created {len(chunks)} chunks")
        print(f"   ✓ First chunk: {chunks[0][:100]}...")
        
        # Test embedding generation
        print("\n2. Testing embedding generation...")
        embedding = await embedding_service.generate_embedding(chunks[0])
        print(f"   ✓ Generated embedding with {len(embedding)} dimensions")
        
        # Test embedding format for PostgreSQL
        print("\n3. Testing PostgreSQL vector format...")
        embedding_str = "[" + ",".join(map(str, embedding)) + "]"
        print(f"   ✓ Formatted embedding: {embedding_str[:100]}...")
        print(f"   ✓ String length: {len(embedding_str)} characters")
        
        # Test batch processing
        print("\n4. Testing batch embedding generation...")
        if len(chunks) > 1:
            batch_embeddings = await embedding_service.generate_batch_embeddings(chunks[:3])
            print(f"   ✓ Generated {len(batch_embeddings)} embeddings in batch")
        
        print("\n✅ All document processing tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_document_processing())
