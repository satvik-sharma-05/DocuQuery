#!/usr/bin/env python3
"""
Manually fix the HackTrack chunks in the database
"""

import asyncio
from app.models.database import db
from app.services.embedding_service import embedding_service

async def fix_hacktrack():
    """Fix HackTrack chunks manually"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            print("=== FIXING HACKTRACK CHUNKS ===\n")
            
            # Get the resume document
            resume_doc = await conn.fetchrow("""
                SELECT id, workspace_id FROM documents 
                WHERE name = 'resume_3.docx'
                AND workspace_id = (SELECT id FROM workspaces WHERE name LIKE '%Satvik%')
            """)
            
            if not resume_doc:
                print("❌ resume_3.docx not found!")
                return
                
            document_id = resume_doc['id']
            workspace_id = resume_doc['workspace_id']
            
            print(f"✅ Found document: {document_id}")
            
            # Find the chunk that should contain HackTrack (the one with hackathon platform description)
            target_chunk = await conn.fetchrow("""
                SELECT id, content FROM document_chunks 
                WHERE document_id = $1 
                AND LOWER(content) LIKE '%production-grade ai platform%'
                AND LOWER(content) LIKE '%hackathons%'
                LIMIT 1
            """, document_id)
            
            if not target_chunk:
                print("❌ Target chunk not found!")
                return
                
            print(f"✅ Found target chunk: {target_chunk['id']}")
            print(f"Current content: {target_chunk['content'][:100]}...")
            
            # Create the corrected content with HackTrack name
            corrected_content = """HackTrack – AI-Powered Hackathon Platform
Live: https://hacktrack1-mu.vercel.app/
GitHub: Repository
Tech Stack: React, Node.js, Express, MongoDB, JWT, Hugging Face, Sentence-BERT, Vector Embeddings, Vercel, Render

Built a production-grade AI platform to discover hackathons, match developers, and automatically form balanced teams using semantic embeddings.
Designed a microservices architecture with frontend on Vercel, backend on Render, MongoDB Atlas for persistence, and Hugging Face for embedding generation.
Implemented semantic teammate search using Sentence-BERT embeddings and cosine similarity, enabling intent-based matching beyond keyword search.
Developed an AI-driven recommendation engine combining semantic similarity, skill complementarity, role balance, and domain alignment.
Built an automatic team formation algorithm ensuring diverse roles, balanced skills, and time compatibility across teams.
Integrated multi-source hackathon aggregation (Devpost, MLH, Clist, user submissions) with deduplication, caching, and fault isolation.
Implemented secure JWT-based authentication, role-based access control, and scalable stateless APIs.
Deployed with health checks, graceful degradation, and caching, achieving sub-300ms search latency and reliable production uptime."""
            
            # Generate new embedding for the corrected content
            print("🔄 Generating new embedding...")
            new_embedding = await embedding_service.generate_embedding(corrected_content)
            embedding_str = "[" + ",".join(map(str, new_embedding)) + "]"
            
            # Update the chunk
            await conn.execute("""
                UPDATE document_chunks 
                SET content = $1, embedding = $2::vector
                WHERE id = $3
            """, corrected_content, embedding_str, target_chunk['id'])
            
            print("✅ Updated chunk with HackTrack content and new embedding!")
            
            # Test the fix
            print("\n🔍 Testing the fix...")
            from app.services.rag_pipeline import rag_pipeline
            
            answer, sources = await rag_pipeline.query("what is hacktrack", str(workspace_id))
            print(f"Answer: {answer[:200]}...")
            print(f"Sources: {len(sources)}")
            
            if 'hacktrack' in answer.lower():
                print("🎯 SUCCESS! HackTrack is now found in the answer!")
            else:
                print("❌ Still not working...")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_hacktrack())