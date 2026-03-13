#!/usr/bin/env python3
"""
Fix the resume upload issue by deleting the current resume_3.docx
so user can re-upload the correct version
"""

import asyncio
from app.models.database import db
from app.core.security import get_supabase_client

async def fix_resume():
    """Delete the current resume_3.docx so user can re-upload"""
    try:
        pool = await db.get_pool()
        supabase = get_supabase_client()
        
        async with pool.acquire() as conn:
            
            print("=== FIXING RESUME UPLOAD ISSUE ===\n")
            
            # Get the current resume_3.docx
            resume_doc = await conn.fetchrow("""
                SELECT d.id, d.file_path, d.workspace_id
                FROM documents d
                JOIN workspaces w ON d.workspace_id = w.id
                WHERE d.name = 'resume_3.docx' 
                AND w.name LIKE '%Satvik%'
            """)
            
            if not resume_doc:
                print("❌ resume_3.docx not found in Satvik's workspace!")
                return
                
            document_id = resume_doc['id']
            file_path = resume_doc['file_path']
            
            print(f"✅ Found resume_3.docx: {document_id}")
            print(f"   File path: {file_path}")
            
            # Delete document chunks first (foreign key constraint)
            chunks_deleted = await conn.execute("""
                DELETE FROM document_chunks 
                WHERE document_id = $1
            """, document_id)
            
            print(f"✅ Deleted document chunks")
            
            # Delete document record
            await conn.execute("""
                DELETE FROM documents 
                WHERE id = $1
            """, document_id)
            
            print(f"✅ Deleted document record")
            
            # Delete file from Supabase storage
            try:
                supabase.storage.from_("documents").remove([file_path])
                print(f"✅ Deleted file from storage")
            except Exception as e:
                print(f"⚠️  Warning: Could not delete file from storage: {e}")
                print("   This is okay, the file might not exist in storage")
            
            print(f"\n🎯 SUCCESS! resume_3.docx has been deleted.")
            print(f"📋 Next steps:")
            print(f"   1. Go to the Documents page in the frontend")
            print(f"   2. Upload your resume again with the correct content")
            print(f"   3. Make sure the file contains 'HackTrack – AI-Powered Hackathon Platform'")
            print(f"   4. Test the chat again with 'what is hacktrack?'")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_resume())