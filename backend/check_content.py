#!/usr/bin/env python3
"""
Check the actual content of document chunks
"""

import asyncio
from app.models.database import db

async def check_content():
    """Check actual content in chunks"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            # Get chunks from resume_3.docx
            chunks = await conn.fetch("""
                SELECT dc.content
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE d.name = 'resume_3.docx'
                ORDER BY dc.id
            """)
            
            print(f"Found {len(chunks)} chunks from resume_3.docx\n")
            
            for i, chunk in enumerate(chunks):
                content = chunk['content']
                print(f"=== CHUNK {i+1} ===")
                print(content)
                print("\n" + "="*50 + "\n")
                
                # Check if this chunk mentions hacktrack/hacktrack
                if 'hacktrack' in content.lower() or 'hack track' in content.lower():
                    print(f"🎯 CHUNK {i+1} CONTAINS HACKTRACK REFERENCE!")
                    print("="*50 + "\n")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_content())