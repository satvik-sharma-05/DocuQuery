import asyncio
from app.models.database import db

async def debug_hacktrack():
    try:
        pool = await db.get_pool()
        
        workspace_id = '550e8400-e29b-41d4-a716-446655440000'
        
        async with pool.acquire() as conn:
            # Check documents in workspace
            docs = await conn.fetch("""
                SELECT id, name, description, created_at 
                FROM documents 
                WHERE workspace_id = $1
                ORDER BY created_at DESC
            """, workspace_id)
            
            print(f"Documents in workspace {workspace_id}:")
            for doc in docs:
                print(f"- {doc['name']} (ID: {doc['id']})")
                
                # Check chunks for each document
                chunks = await conn.fetch("""
                    SELECT id, content, LENGTH(content) as content_length
                    FROM document_chunks 
                    WHERE document_id = $1
                    ORDER BY chunk_index
                """, doc['id'])
                
                print(f"  Chunks: {len(chunks)}")
                
                # Search for hacktrack in content
                hacktrack_chunks = await conn.fetch("""
                    SELECT id, content, LENGTH(content) as content_length
                    FROM document_chunks 
                    WHERE document_id = $1 AND LOWER(content) LIKE '%hacktrack%'
                """, doc['id'])
                
                print(f"  HackTrack mentions: {len(hacktrack_chunks)}")
                
                if hacktrack_chunks:
                    for chunk in hacktrack_chunks:
                        print(f"    Chunk {chunk['id']}: {chunk['content'][:200]}...")
                        
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_hacktrack())