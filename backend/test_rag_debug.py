#!/usr/bin/env python3
"""
Debug RAG pipeline - check if document chunks exist and test retrieval
"""

import asyncio
from app.models.database import db
from app.services.embedding_service import embedding_service
from app.services.rag_pipeline import rag_pipeline

async def debug_rag():
    """Debug RAG pipeline"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            print("=== RAG DEBUG REPORT ===\n")
            
            # 1. Check if documents exist
            documents = await conn.fetch("""
                SELECT d.id, d.name, d.workspace_id, w.name as workspace_name
                FROM documents d
                JOIN workspaces w ON d.workspace_id = w.id
                ORDER BY d.created_at DESC
            """)
            
            print(f"📄 Documents in database: {len(documents)}")
            for doc in documents:
                print(f"   - {doc['name']} (ID: {doc['id']}) in workspace: {doc['workspace_name']}")
            
            if not documents:
                print("❌ No documents found! Please upload documents first.")
                return
            
            # 2. Check document chunks
            chunks = await conn.fetch("""
                SELECT dc.id, dc.document_id, d.name as document_name, 
                       LENGTH(dc.content) as content_length,
                       dc.embedding IS NOT NULL as has_embedding
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                ORDER BY d.name, dc.id
            """)
            
            print(f"\n🧩 Document chunks: {len(chunks)}")
            for chunk in chunks:
                embedding_status = "✅" if chunk['has_embedding'] else "❌"
                print(f"   - {chunk['document_name']}: {chunk['content_length']} chars {embedding_status}")
            
            if not chunks:
                print("❌ No document chunks found! Documents may not be processed.")
                return
            
            # 3. Test a sample query
            test_query = "hacktrack"
            print(f"\n🔍 Testing query: '{test_query}'")
            
            # Get first workspace ID
            workspace_id = documents[0]['workspace_id']
            print(f"   Using workspace: {workspace_id}")
            
            try:
                # Generate query embedding
                query_embedding = await embedding_service.generate_query_embedding(test_query)
                print(f"   Query embedding generated: {len(query_embedding)} dimensions")
                
                # Search similar chunks
                similar_chunks = await rag_pipeline.search_similar_chunks(query_embedding, workspace_id)
                print(f"   Similar chunks found: {len(similar_chunks)}")
                
                for i, chunk in enumerate(similar_chunks[:3]):  # Show top 3
                    print(f"     {i+1}. {chunk['document_name']} (distance: {chunk['distance']:.4f})")
                    print(f"        Preview: {chunk['content'][:100]}...")
                
                if similar_chunks:
                    # Test full RAG pipeline
                    answer, sources = await rag_pipeline.query(test_query, workspace_id)
                    print(f"\n💬 RAG Answer: {answer[:200]}...")
                    print(f"   Sources: {len(sources)}")
                else:
                    print("   No similar chunks found for this query")
                    
            except Exception as e:
                print(f"❌ Error testing RAG: {e}")
            
            # 4. Check specific content
            print(f"\n🔍 Searching for 'resume' content...")
            resume_chunks = await conn.fetch("""
                SELECT dc.content, d.name as document_name
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE LOWER(dc.content) LIKE '%resume%' OR LOWER(d.name) LIKE '%resume%'
                LIMIT 5
            """)
            
            print(f"   Resume-related chunks: {len(resume_chunks)}")
            for chunk in resume_chunks:
                print(f"     - {chunk['document_name']}: {chunk['content'][:100]}...")
                
    except Exception as e:
        print(f"❌ Debug failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_rag())