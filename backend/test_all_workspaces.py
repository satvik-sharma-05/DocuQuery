import asyncio
from app.models.database import db

async def check():
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        # Check all workspaces
        workspaces = await conn.fetch("SELECT id, name FROM workspaces")
        print('All workspaces:')
        for ws in workspaces:
            print(f"  - {ws['name']} (id: {ws['id']})")
        
        print('\n' + '='*60)
        
        # Check documents in each workspace
        for ws in workspaces:
            docs = await conn.fetch("""
                SELECT id, name, uploaded_by
                FROM documents 
                WHERE workspace_id = $1
            """, ws['id'])
            
            print(f"\n{ws['name']} workspace:")
            if docs:
                for doc in docs:
                    chunks = await conn.fetchval("""
                        SELECT COUNT(*) 
                        FROM document_chunks 
                        WHERE document_id = $1
                    """, doc['id'])
                    
                    with_emb = await conn.fetchval("""
                        SELECT COUNT(*) 
                        FROM document_chunks 
                        WHERE document_id = $1 AND embedding IS NOT NULL
                    """, doc['id'])
                    
                    print(f"  - {doc['name']}")
                    print(f"    Uploaded by: {doc['uploaded_by']}")
                    print(f"    Chunks: {chunks} (with embeddings: {with_emb})")
            else:
                print("  No documents")

asyncio.run(check())
