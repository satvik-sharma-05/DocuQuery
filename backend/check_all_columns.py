import asyncio
from app.models.database import db

async def check_all_columns():
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        # Check all columns with their constraints
        result = await conn.fetch("""
            SELECT 
                column_name, 
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'document_chunks'
            ORDER BY ordinal_position
        """)
        print('document_chunks columns:')
        for row in result:
            nullable = "NULL" if row["is_nullable"] == "YES" else "NOT NULL"
            default = f" DEFAULT {row['column_default']}" if row['column_default'] else ""
            print(f'  {row["column_name"]}: {row["data_type"]} {nullable}{default}')
        
        # Check constraints
        constraints = await conn.fetch("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'document_chunks'
        """)
        print('\nConstraints:')
        for row in constraints:
            print(f'  {row["constraint_name"]}: {row["constraint_type"]}')

asyncio.run(check_all_columns())
