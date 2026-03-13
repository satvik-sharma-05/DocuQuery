import asyncio
from app.models.database import db

async def check_schema():
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        # Check document_chunks table structure
        result = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'document_chunks'
            ORDER BY ordinal_position
        """)
        print('document_chunks columns:')
        for row in result:
            print(f'  {row["column_name"]}: {row["data_type"]}')
        
        # Check if there are any documents
        docs = await conn.fetch("SELECT COUNT(*) as count FROM documents")
        print(f'\nTotal documents: {docs[0]["count"]}')
        
        # Check if there are any chunks
        chunks = await conn.fetch("SELECT COUNT(*) as count FROM document_chunks")
        print(f'Total chunks: {chunks[0]["count"]}')

asyncio.run(check_schema())
