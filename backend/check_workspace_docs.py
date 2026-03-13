import asyncio
from app.models.database import db

async def check():
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        # Check documents and their workspaces
        docs = await conn.fetch("""
            SELECT 
                d.id,
                d.name,
                d.workspace_id,
                w.name as workspace_name,
                COUNT(dc.id) as chunk_count
            FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            LEFT JOIN document_chunks dc ON d.id = dc.document_id
            GROUP BY d.id, d.name, d.workspace_id, w.name
            ORDER BY d.created_at DESC
        """)
        
        print("Documents by workspace:")
        print("=" * 80)
        for doc in docs:
            print(f"\nWorkspace: {doc['workspace_name']} ({doc['workspace_id']})")
            print(f"  Document: {doc['name']}")
            print(f"  Chunks: {doc['chunk_count']}")
        
        # Check all workspaces
        print("\n" + "=" * 80)
        print("\nAll workspaces:")
        workspaces = await conn.fetch("SELECT id, name FROM workspaces")
        for ws in workspaces:
            print(f"  {ws['name']}: {ws['id']}")

asyncio.run(check())
