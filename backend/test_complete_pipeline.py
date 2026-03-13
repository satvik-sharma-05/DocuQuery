#!/usr/bin/env python3
"""
Complete pipeline test for document upload and RAG retrieval
"""

import asyncio
import sys
from app.models.database import db
from app.services.document_processor import document_processor
from app.services.embedding_service import embedding_service
from app.services.rag_pipeline import rag_pipeline

async def test_pipeline():
    print("=" * 60)
    print("COMPLETE PIPELINE TEST")
    print("=" * 60)
    
    # Test 1: Database connection
    print("\n[1/6] Testing database connection...")
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False
    
    # Test 2: Check for documents and chunks
    print("\n[2/6] Checking existing documents...")
    try:
        async with pool.acquire() as conn:
            doc_count = await conn.fetchval("SELECT COUNT(*) FROM documents")
            chunk_count = await conn.fetchval("SELECT COUNT(*) FROM document_chunks")
            print(f"✓ Found {doc_count} documents with {chunk_count} chunks")
            
            if doc_count == 0:
                print("⚠ No documents found - upload a document first")
                return False
            
            if chunk_count == 0:
                print("⚠ No chunks found - documents may not be processed yet")
                return False
    except Exception as e:
        print(f"✗ Failed to check documents: {e}")
        return False
    
    # Test 3: Document processor
    print("\n[3/6] Testing document processor...")
    try:
        test_text = "This is a test document about quantum computing. " * 50
        chunks = document_processor.chunk_text(test_text)
        print(f"✓ Document processor created {len(chunks)} chunks")
    except Exception as e:
        print(f"✗ Document processor failed: {e}")
        return False
    
    # Test 4: Embedding service
    print("\n[4/6] Testing embedding service...")
    try:
        test_text = "What is quantum computing?"
        embedding = await embedding_service.generate_query_embedding(test_text)
        print(f"✓ Embedding service generated {len(embedding)} dimensions")
        
        if len(embedding) != 1024:
            print(f"✗ Wrong embedding dimension: expected 1024, got {len(embedding)}")
            return False
    except Exception as e:
        print(f"✗ Embedding service failed: {e}")
        return False
    
    # Test 5: Get a workspace ID
    print("\n[5/6] Getting workspace ID...")
    try:
        async with pool.acquire() as conn:
            workspace = await conn.fetchrow("SELECT id FROM workspaces LIMIT 1")
            if not workspace:
                print("✗ No workspace found")
                return False
            workspace_id = str(workspace['id'])
            print(f"✓ Using workspace: {workspace_id}")
    except Exception as e:
        print(f"✗ Failed to get workspace: {e}")
        return False
    
    # Test 6: RAG pipeline
    print("\n[6/6] Testing RAG pipeline...")
    try:
        test_query = "What is this document about?"
        print(f"Query: '{test_query}'")
        
        answer, sources = await rag_pipeline.query(test_query, workspace_id)
        
        print(f"✓ RAG pipeline completed")
        print(f"\nAnswer ({len(answer)} chars):")
        print("-" * 60)
        print(answer[:500] + ("..." if len(answer) > 500 else ""))
        print("-" * 60)
        print(f"\nSources: {len(sources)}")
        for i, source in enumerate(sources, 1):
            print(f"  {i}. {source['document_name']} (relevance: {source['relevance_score']:.3f})")
        
    except Exception as e:
        print(f"✗ RAG pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✓")
    print("=" * 60)
    return True

if __name__ == "__main__":
    result = asyncio.run(test_pipeline())
    sys.exit(0 if result else 1)
