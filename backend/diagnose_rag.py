#!/usr/bin/env python3
"""
Diagnostic script for RAG system
"""

import asyncio
from app.models.database import db
from app.core.config import settings

async def diagnose():
    print("=" * 70)
    print("RAG SYSTEM DIAGNOSTICS")
    print("=" * 70)
    
    # Check configuration
    print("\n[CONFIG]")
    print(f"  Cohere API Key: {'✓ Set' if settings.COHERE_API_KEY else '✗ Missing'}")
    print(f"  LLM Model: {settings.LLM_MODEL}")
    print(f"  Embedding Model: {settings.EMBEDDING_MODEL}")
    print(f"  Embedding Dimension: {settings.EMBEDDING_DIMENSION}")
    print(f"  Chunk Size: {settings.CHUNK_SIZE}")
    print(f"  Chunk Overlap: {settings.CHUNK_OVERLAP}")
    print(f"  Top K Results: {settings.TOP_K_RESULTS}")
    
    # Check database
    print("\n[DATABASE]")
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            # Check tables
            tables = await conn.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('workspaces', 'documents', 'document_chunks', 'conversations', 'messages')
                ORDER BY table_name
            """)
            print(f"  Tables: {', '.join([t['table_name'] for t in tables])}")
            
            # Check vector extension
            extensions = await conn.fetch("""
                SELECT extname FROM pg_extension WHERE extname = 'vector'
            """)
            print(f"  Vector Extension: {'✓ Installed' if extensions else '✗ Missing'}")
            
            # Check data counts
            workspaces = await conn.fetchval("SELECT COUNT(*) FROM workspaces")
            documents = await conn.fetchval("SELECT COUNT(*) FROM documents")
            chunks = await conn.fetchval("SELECT COUNT(*) FROM document_chunks")
            conversations = await conn.fetchval("SELECT COUNT(*) FROM conversations")
            messages = await conn.fetchval("SELECT COUNT(*) FROM messages")
            
            print(f"\n[DATA COUNTS]")
            print(f"  Workspaces: {workspaces}")
            print(f"  Documents: {documents}")
            print(f"  Document Chunks: {chunks}")
            print(f"  Conversations: {conversations}")
            print(f"  Messages: {messages}")
            
            # Check document_chunks structure
            print(f"\n[DOCUMENT_CHUNKS SCHEMA]")
            columns = await conn.fetch("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'document_chunks'
                ORDER BY ordinal_position
            """)
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                print(f"  {col['column_name']}: {col['data_type']} ({nullable})")
            
            # Check for chunks with NULL embeddings
            null_embeddings = await conn.fetchval("""
                SELECT COUNT(*) FROM document_chunks WHERE embedding IS NULL
            """)
            print(f"\n[EMBEDDING STATUS]")
            print(f"  Chunks with embeddings: {chunks - null_embeddings}")
            print(f"  Chunks without embeddings: {null_embeddings}")
            
            if null_embeddings > 0:
                print(f"  ⚠ WARNING: {null_embeddings} chunks have NULL embeddings!")
            
            # Check embedding dimensions
            if chunks > 0:
                sample = await conn.fetchrow("""
                    SELECT 
                        d.name as doc_name,
                        LENGTH(dc.content) as content_length
                    FROM document_chunks dc
                    JOIN documents d ON dc.document_id = d.id
                    WHERE dc.embedding IS NOT NULL
                    LIMIT 1
                """)
                if sample:
                    print(f"\n[SAMPLE CHUNK]")
                    print(f"  Document: {sample['doc_name']}")
                    print(f"  Content Length: {sample['content_length']} chars")
                    print(f"  Embedding Dimension: {settings.EMBEDDING_DIMENSION} (configured)")
            
            # Check indexes
            print(f"\n[INDEXES]")
            indexes = await conn.fetch("""
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'document_chunks'
                AND indexname LIKE '%embedding%'
            """)
            if indexes:
                for idx in indexes:
                    print(f"  ✓ {idx['indexname']}")
            else:
                print(f"  ⚠ No vector index found on embeddings!")
            
            # List documents
            if documents > 0:
                print(f"\n[DOCUMENTS]")
                docs = await conn.fetch("""
                    SELECT 
                        d.name,
                        d.description,
                        COUNT(dc.id) as chunk_count,
                        d.created_at
                    FROM documents d
                    LEFT JOIN document_chunks dc ON d.id = dc.document_id
                    GROUP BY d.id, d.name, d.description, d.created_at
                    ORDER BY d.created_at DESC
                    LIMIT 5
                """)
                for doc in docs:
                    print(f"  • {doc['name']}")
                    print(f"    Description: {doc['description'] or 'N/A'}")
                    print(f"    Chunks: {doc['chunk_count']}")
                    print(f"    Created: {doc['created_at']}")
                    print()
            
    except Exception as e:
        print(f"  ✗ Database error: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(diagnose())
