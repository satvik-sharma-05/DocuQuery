#!/usr/bin/env python3
"""
Debug the specific resume_3.docx content in Satvik's workspace
"""

import asyncio
from app.models.database import db
from app.services.rag_pipeline import rag_pipeline

async def debug_resume():
    """Debug resume content in Satvik's workspace"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            print("=== DEBUGGING RESUME_3.DOCX IN SATVIK'S WORKSPACE ===\n")
            
            # Get Satvik's workspace ID
            satvik_workspace = await conn.fetchrow("""
                SELECT id, name FROM workspaces 
                WHERE name LIKE '%Satvik%'
            """)
            
            if not satvik_workspace:
                print("❌ Satvik's workspace not found!")
                return
                
            workspace_id = satvik_workspace['id']
            print(f"✅ Found workspace: {satvik_workspace['name']} ({workspace_id})")
            
            # Get resume_3.docx document
            resume_doc = await conn.fetchrow("""
                SELECT id, name FROM documents 
                WHERE workspace_id = $1 AND name = 'resume_3.docx'
            """, workspace_id)
            
            if not resume_doc:
                print("❌ resume_3.docx not found in Satvik's workspace!")
                return
                
            print(f"✅ Found document: {resume_doc['name']} ({resume_doc['id']})")
            
            # Get all chunks from this document
            chunks = await conn.fetch("""
                SELECT id, content, LENGTH(content) as length
                FROM document_chunks 
                WHERE document_id = $1
                ORDER BY id
            """, resume_doc['id'])
            
            print(f"✅ Found {len(chunks)} chunks")
            
            # Check each chunk for HackTrack
            hacktrack_found = False
            for i, chunk in enumerate(chunks):
                content = chunk['content'].lower()
                if 'hacktrack' in content or 'hack track' in content:
                    hacktrack_found = True
                    print(f"\n🎯 CHUNK {i+1} CONTAINS HACKTRACK!")
                    print(f"Length: {chunk['length']} chars")
                    print(f"Content preview: {chunk['content'][:200]}...")
                    print("="*50)
            
            if not hacktrack_found:
                print("\n❌ NO HACKTRACK FOUND IN ANY CHUNKS!")
                print("This means the document processing didn't capture the HackTrack section.")
                print("\nLet's check what content IS in the chunks:")
                
                for i, chunk in enumerate(chunks):
                    print(f"\n--- CHUNK {i+1} ({chunk['length']} chars) ---")
                    print(chunk['content'][:300] + "..." if len(chunk['content']) > 300 else chunk['content'])
            
            # Test RAG query
            print(f"\n🔍 Testing RAG query in workspace {workspace_id}")
            try:
                answer, sources = await rag_pipeline.query("what is hacktrack", str(workspace_id))
                print(f"Answer: {answer}")
                print(f"Sources found: {len(sources)}")
            except Exception as e:
                print(f"❌ RAG query failed: {e}")
                
    except Exception as e:
        print(f"❌ Debug failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_resume())