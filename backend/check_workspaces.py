#!/usr/bin/env python3
"""
Check which documents are in which workspaces
"""

import asyncio
from app.models.database import db

async def check_workspaces():
    """Check workspace document distribution"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            
            # Get all workspaces and their documents
            result = await conn.fetch("""
                SELECT w.id, w.name as workspace_name, d.name as document_name
                FROM workspaces w
                LEFT JOIN documents d ON w.id = d.workspace_id
                ORDER BY w.name, d.name
            """)
            
            current_workspace = None
            for row in result:
                if row['workspace_name'] != current_workspace:
                    print(f"\n=== {row['workspace_name']} ({row['id']}) ===")
                    current_workspace = row['workspace_name']
                if row['document_name']:
                    print(f"  - {row['document_name']}")
                    
            # Check which workspace has the HackTrack reference
            hacktrack_docs = await conn.fetch("""
                SELECT w.name as workspace_name, d.name as document_name
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                JOIN workspaces w ON d.workspace_id = w.id
                WHERE LOWER(dc.content) LIKE '%hacktrack%'
            """)
            
            print(f"\n=== Documents containing 'HackTrack' ===")
            for doc in hacktrack_docs:
                print(f"  - {doc['document_name']} in {doc['workspace_name']}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_workspaces())