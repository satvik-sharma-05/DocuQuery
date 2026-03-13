import asyncio
from app.models.database import db

async def check_all_documents():
    try:
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Check all documents across all workspaces
            docs = await conn.fetch("""
                SELECT d.id, d.name, d.workspace_id, d.created_at,
                       (SELECT COUNT(*) FROM document_chunks WHERE document_id = d.id) as chunk_count
                FROM documents d
                ORDER BY d.created_at DESC
            """)
            
            print(f"Total documents in database: {len(docs)}")
            
            for doc in docs:
                print(f"- {doc['name']} (Workspace: {doc['workspace_id']}, Chunks: {doc['chunk_count']})")
                
                # Check for hacktrack content in this document
                hacktrack_chunks = await conn.fetch("""
                    SELECT id, content
                    FROM document_chunks 
                    WHERE document_id = $1 AND LOWER(content) LIKE '%hacktrack%'
                    LIMIT 3
                """, doc['id'])
                
                if hacktrack_chunks:
                    print(f"  *** HACKTRACK FOUND in {doc['name']} ***")
                    for chunk in hacktrack_chunks:
                        print(f"    {chunk['content'][:150]}...")
                        
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_all_documents())