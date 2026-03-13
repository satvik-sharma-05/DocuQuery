#!/usr/bin/env python3
"""
Debug the enhanced RAG pipeline
"""

import asyncio
from app.models.database import db
from app.services.embedding_service import embedding_service

async def debug_enhanced_rag():
    """Debug enhanced RAG pipeline"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            print("=== DEBUGGING ENHANCED RAG ===\n")
            
            workspace_id = "852e656d-22b6-42de-b57a-fcea44726b3d"
            
            # Check if chunks exist
            chunks = await conn.fetch("""
                SELECT 
                    dc.id,
                    dc.content,
                    d.name as document_name,
                    dc.embedding IS NOT NULL as has_embedding
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE d.workspace_id = $1
                ORDER BY d.name, dc.id
            """, workspace_id)
            
            print(f"Found {len(chunks)} chunks in workspace")
            
            if not chunks:
                print("❌ No chunks found!")
                return
            
            # Show chunk info
            for i, chunk in enumerate(chunks[:5]):
                print(f"\nChunk {i+1}: {chunk['document_name']}")
                print(f"  Has embedding: {chunk['has_embedding']}")
                print(f"  Content: {chunk['content'][:100]}...")
            
            # Test embedding generation
            test_query = "hacktrack"
            print(f"\n🔍 Testing query: '{test_query}'")
            
            query_embedding = await embedding_service.generate_query_embedding(test_query)
            print(f"Query embedding generated: {len(query_embedding)} dimensions")
            
            # Test similarity search without threshold
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            similarity_results = await conn.fetch("""
                SELECT 
                    dc.content,
                    d.name as document_name,
                    dc.embedding <-> $1::vector as distance,
                    1 - (dc.embedding <-> $1::vector) as similarity_score
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE d.workspace_id = $2
                ORDER BY dc.embedding <-> $1::vector
                LIMIT 10
            """, embedding_str, workspace_id)
            
            print(f"\nSimilarity search results:")
            for i, result in enumerate(similarity_results):
                print(f"  {i+1}. {result['document_name']}")
                print(f"     Similarity: {result['similarity_score']:.4f}")
                print(f"     Content: {result['content'][:100]}...")
                print()
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_enhanced_rag())