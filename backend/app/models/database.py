from supabase import create_client, Client
from app.core.config import settings
import asyncpg
from typing import Optional

class Database:
    def __init__(self):
        self.supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
        self._pool: Optional[asyncpg.Pool] = None
    
    async def get_pool(self) -> asyncpg.Pool:
        """Get asyncpg connection pool for direct database operations"""
        if not self._pool:
            self._pool = await asyncpg.create_pool(
                settings.SUPABASE_DB_URL,
                min_size=1,
                max_size=5,  # Limit pool size for Supabase session mode
                command_timeout=60
            )
        return self._pool
    
    async def close_pool(self):
        """Close the connection pool"""
        if self._pool:
            await self._pool.close()
            self._pool = None

# Global database instance
db = Database()