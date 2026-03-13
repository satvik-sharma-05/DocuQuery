import asyncio
from app.models.database import db

async def check():
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        # Check documents in Rohan's workspace
        docs = await conn.fetch("""
            SELECT id, name, workspace_id 
            FROM documents 
            WHERE workspace_id = '4c0900e7-1fca-4fb1-bc50-de5a20b638bd'
        """)
        print('Documents in Rohan workspace:')
        for doc in docs:
            print(f"  - {doc['name']} (id: {doc['id']})")
        
        # Check chunks with embeddings
        chunks = await conn.fetch("""
            SELECT dc.id, dc.document_id, d.name, dc.embedding IS NOT NULL as has_embedding
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE d.workspace_id = '4c0900e7-1fca-4fb1-bc50-de5a20b638bd'
        """)
        print(f'\nTotal chunks: {len(chunks)}')
        with_embeddings = sum(1 for c in chunks if c['has_embedding'])
        print(f'Chunks with embeddings: {with_embeddings}')
        
        # Check if embeddings are valid vectors
        if chunks:
            sample = await conn.fetchrow("""
                SELECT dc.embedding, array_length(dc.embedding, 1) as dim
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE d.workspace_id = '4c0900e7-1fca-4fb1-bc50-de5a20b638bd'
                AND dc.embedding IS NOT NULL
                LIMIT 1
            """)
            if sample:
                print(f"Sample embedding dimension: {sample['dim']}")

asyncio.run(check())
