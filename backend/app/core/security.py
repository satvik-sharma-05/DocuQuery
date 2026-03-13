from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings
from app.models.database import db
from typing import Dict, Any
import uuid

security = HTTPBearer()


def get_supabase_client() -> Client:
    """
    Create and return Supabase client using service role key
    Service role bypasses RLS policies
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    # Ensure we're using the service role which bypasses RLS
    return client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Validate Supabase JWT token and return user information
    """
    try:
        token = credentials.credentials
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authentication token provided"
            )

        supabase = get_supabase_client()

        try:
            user_response = supabase.auth.get_user(token)
        except Exception as auth_error:
            # Token is invalid or expired
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        user = user_response.user

        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata or {}
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )


async def get_user_workspace(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch workspace information for the current user.

    Uses a JOIN between workspace_members and workspaces
    to reduce database queries.
    """

    supabase = get_supabase_client()

    try:
        # Single query with join
        response = (
            supabase.table("workspace_members")
            .select("workspace_id, role, workspaces(*)")
            .eq("user_id", user["id"])
            .execute()
        )

        # If user has workspace membership
        if response.data:
            member = response.data[0]

            return {
                "workspace_id": member["workspace_id"],
                "role": member["role"],
                "workspace": member["workspaces"]
            }

        # --------------------------------------------------
        # Auto-create workspace if user has none
        # Use direct database connection to bypass RLS
        # --------------------------------------------------

        pool = await db.get_pool()
        workspace_id = str(uuid.uuid4())
        
        async with pool.acquire() as conn:
            # Insert workspace directly (bypasses RLS)
            await conn.execute(
                """
                INSERT INTO workspaces (id, name, created_at)
                VALUES ($1, $2, NOW())
                """,
                workspace_id,
                f"{user['email']}'s Workspace"
            )
            
            # Insert workspace member directly (bypasses RLS)
            await conn.execute(
                """
                INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
                VALUES ($1, $2, $3, NOW())
                """,
                workspace_id,
                user["id"],
                "owner"
            )
            
            # Fetch the created workspace
            workspace_row = await conn.fetchrow(
                "SELECT id, name, created_at FROM workspaces WHERE id = $1",
                workspace_id
            )

        if not workspace_row:
            raise HTTPException(
                status_code=500,
                detail="Failed to create workspace"
            )

        workspace = {
            "id": str(workspace_row["id"]),
            "name": workspace_row["name"],
            "created_at": workspace_row["created_at"].isoformat()
        }

        return {
            "workspace_id": workspace["id"],
            "role": "owner",
            "workspace": workspace
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching workspace: {str(e)}"
        )

