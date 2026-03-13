#!/usr/bin/env python3
"""
Find HackTrack references in all documents
"""

import asyncio
from app.models.database import db

async def find_hacktrack():
    """Find HackTrack references"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            # Search for any content containing 'hacktrack' variants
            chunks = await conn.fetch("""
                SELECT dc.content, d.name as document_name
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE LOWER(dc.content) LIKE '%hacktrack%' 
                   OR LOWER(dc.content) LIKE '%hack track%'
                   OR LOWER(dc.content) LIKE '%hack-track%'
            """)
            
            print(f"Found {len(chunks)} chunks containing hacktrack variants")
            for chunk in chunks:
                print(f"Document: {chunk['document_name']}")
                print(f"Content: {chunk['content']}")
                print("="*50)
                
            # Also search in all resume chunks for project names
            print("\n\nSearching for project sections in resume...")
            resume_chunks = await conn.fetch("""
                SELECT dc.content
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE d.name LIKE '%resume%'
                AND (LOWER(dc.content) LIKE '%project%' 
                     OR LOWER(dc.content) LIKE '%live:%'
                     OR LOWER(dc.content) LIKE '%github:%')
                ORDER BY dc.id
            """)
            
            for i, chunk in enumerate(resume_chunks):
                print(f"\n=== PROJECT CHUNK {i+1} ===")
                print(chunk['content'])
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(find_hacktrack())