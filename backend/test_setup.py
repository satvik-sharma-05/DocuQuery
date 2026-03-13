#!/usr/bin/env python3
"""
Simple test script to verify DocuQuery backend setup
"""

import asyncio
import sys
from app.core.config import settings
from app.models.database import db
from app.core.security import get_supabase_client

async def test_database_connection():
    """Test database connection"""
    try:
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            print("✅ Database connection: OK")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_supabase_connection():
    """Test Supabase connection"""
    try:
        supabase = get_supabase_client()
        # Try to list users (will fail if credentials are wrong)
        supabase.auth.admin.list_users()
        print("✅ Supabase connection: OK")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def test_cohere_api():
    """Test Cohere API key"""
    try:
        import cohere
        client = cohere.Client(settings.COHERE_API_KEY)
        
        # Try to generate a simple embedding
        result = client.embed(
            texts=["test"],
            model=settings.EMBEDDING_MODEL,
            input_type="search_document"
        )
        print("✅ Cohere API connection: OK")
        return True
    except Exception as e:
        print(f"❌ Cohere API connection failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🔍 Testing DocuQuery Backend Setup...\n")
    
    print("📋 Configuration:")
    print(f"   App Name: {settings.APP_NAME}")
    print(f"   Environment: {settings.APP_ENV}")
    print(f"   Supabase URL: {settings.SUPABASE_URL}")
    print(f"   Frontend URL: {settings.FRONTEND_URL}")
    print()
    
    tests = [
        ("Database", test_database_connection()),
        ("Supabase", test_supabase_connection()),
        ("Cohere API", test_cohere_api())
    ]
    
    results = []
    for name, test in tests:
        if asyncio.iscoroutine(test):
            result = await test
        else:
            result = test
        results.append(result)
    
    print(f"\n📊 Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("🎉 All tests passed! Your DocuQuery backend is ready to go!")
        print("\nNext steps:")
        print("1. Start the backend: uvicorn main:app --reload --port 8000")
        print("2. Start the frontend: cd ../frontend && npm run dev")
        print("3. Visit http://localhost:3000 to use DocuQuery")
    else:
        print("⚠️  Some tests failed. Please check your configuration.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())