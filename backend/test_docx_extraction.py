#!/usr/bin/env python3
"""
Test DOCX text extraction to see what's being extracted
"""

import asyncio
from app.models.database import db
from app.services.document_processor import document_processor
import os

async def test_docx_extraction():
    """Test DOCX extraction"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            # Get the resume_3.docx file path
            resume_doc = await conn.fetchrow("""
                SELECT file_path FROM documents 
                WHERE name = 'resume_3.docx'
                AND workspace_id = (SELECT id FROM workspaces WHERE name LIKE '%Satvik%')
            """)
            
            if not resume_doc:
                print("❌ resume_3.docx not found!")
                return
                
            file_path = resume_doc['file_path']
            print(f"✅ Found file: {file_path}")
            
            # Check if file exists
            if not os.path.exists(file_path):
                print(f"❌ File does not exist at: {file_path}")
                return
                
            # Read and extract text
            with open(file_path, 'rb') as f:
                file_content = f.read()
                
            print(f"✅ File size: {len(file_content)} bytes")
            
            # Extract text
            extracted_text = document_processor.extract_text(file_content, 'docx')
            print(f"✅ Extracted text length: {len(extracted_text)} characters")
            
            # Look for HackTrack in the extracted text
            if 'hacktrack' in extracted_text.lower():
                print("🎯 HACKTRACK FOUND IN EXTRACTED TEXT!")
                
                # Find the position and show context
                pos = extracted_text.lower().find('hacktrack')
                start = max(0, pos - 100)
                end = min(len(extracted_text), pos + 200)
                context = extracted_text[start:end]
                print(f"Context: ...{context}...")
            else:
                print("❌ HACKTRACK NOT FOUND IN EXTRACTED TEXT!")
                
            # Show first 1000 characters of extracted text
            print(f"\n=== FIRST 1000 CHARS OF EXTRACTED TEXT ===")
            print(extracted_text[:1000])
            
            # Show last 1000 characters
            print(f"\n=== LAST 1000 CHARS OF EXTRACTED TEXT ===")
            print(extracted_text[-1000:])
            
            # Test chunking
            chunks = document_processor.chunk_text(extracted_text)
            print(f"\n✅ Created {len(chunks)} chunks")
            
            # Check each chunk for HackTrack
            for i, chunk in enumerate(chunks):
                if 'hacktrack' in chunk.lower():
                    print(f"🎯 CHUNK {i+1} CONTAINS HACKTRACK!")
                    print(f"Chunk: {chunk[:200]}...")
                    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_docx_extraction())