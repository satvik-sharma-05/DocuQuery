#!/usr/bin/env python3
"""
Test database connection and check if tables exist
"""

import asyncio
from app.models.database import db

async def test_database():
    """Test database connection and check tables"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            # Check if workspaces table exists
            result = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'workspaces'
                );
            """)
            
            if result:
                print("✅ Database tables exist")
                
                # Count existing workspaces
                count = await conn.fetchval("SELECT COUNT(*) FROM workspaces")
                print(f"📊 Workspaces in database: {count}")
                
            else:
                print("❌ Database tables do not exist")
                print("📋 Please apply the database schema from database/schema.sql")
                print("   1. Go to Supabase SQL Editor")
                print("   2. Copy and paste the content from database/schema.sql")
                print("   3. Execute the script")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("📋 Please check your database configuration in .env file")

if __name__ == "__main__":
    asyncio.run(test_database())