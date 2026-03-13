from fastapi import APIRouter, HTTPException, Depends, status
from app.core.security import get_current_user, get_supabase_client
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


# ================================
# Schemas
# ================================
class CreateWorkspaceRequest(BaseModel):
    name: str
    description: Optional[str] = None


class UpdateWorkspaceRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    role: str
    member_count: int
    created_at: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None


class WorkspaceMemberResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    role: str
    joined_at: str


# ================================
# Create Workspace
# ================================
@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    workspace_data: CreateWorkspaceRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new workspace
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        workspace_id = str(uuid.uuid4())
        
        async with pool.acquire() as conn:
            # Create workspace
            await conn.execute(
                """
                INSERT INTO workspaces (id, name, description, created_by, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                """,
                workspace_id,
                workspace_data.name,
                workspace_data.description,
                current_user["id"]
            )
            
            # Add creator as owner (trigger should do this, but let's be explicit)
            await conn.execute(
                """
                INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (workspace_id, user_id) DO NOTHING
                """,
                workspace_id,
                current_user["id"],
                "owner"
            )
            
            created_at = await conn.fetchval(
                "SELECT created_at FROM workspaces WHERE id = $1",
                workspace_id
            )
        
        return WorkspaceResponse(
            id=workspace_id,
            name=workspace_data.name,
            description=workspace_data.description,
            role="owner",
            member_count=1,
            created_at=created_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Create workspace error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workspace: {str(e)}"
        )


# ================================
# Get User's Workspaces
# ================================
@router.get("/", response_model=List[WorkspaceResponse])
async def get_user_workspaces(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all workspaces the current user belongs to
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    w.id, w.name, w.description, w.created_at, w.created_by,
                    wm.role,
                    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
                    u.email as owner_email,
                    u.raw_user_meta_data->>'full_name' as owner_name
                FROM workspaces w
                JOIN workspace_members wm ON w.id = wm.workspace_id
                LEFT JOIN auth.users u ON w.created_by = u.id
                WHERE wm.user_id = $1::uuid
                ORDER BY w.created_at DESC
                """,
                current_user["id"]
            )
            
            workspaces = []
            for row in rows:
                workspaces.append(WorkspaceResponse(
                    id=str(row["id"]),
                    name=row["name"],
                    description=row["description"],
                    role=row["role"],
                    member_count=row["member_count"],
                    created_at=row["created_at"].isoformat(),
                    owner_id=str(row["created_by"]) if row["created_by"] else None,
                    owner_name=row["owner_name"],
                    owner_email=row["owner_email"]
                ))
            
            return workspaces
        
    except Exception as e:
        logger.error(f"Get workspaces error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workspaces: {str(e)}"
        )




# ================================
# Update Workspace
# ================================
@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_data: UpdateWorkspaceRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update workspace details (name, description)
    Only owners can update workspace
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Verify user is owner
            is_owner = await conn.fetchval(
                """
                SELECT EXISTS(
                    SELECT 1 FROM workspace_members 
                    WHERE workspace_id = $1::uuid AND user_id = $2::uuid AND role = 'owner'
                )
                """,
                workspace_id,
                current_user["id"]
            )
            
            if not is_owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only workspace owners can update workspace settings"
                )
            
            # Build update query
            updates = []
            params = [workspace_id]
            param_count = 2
            
            if workspace_data.name is not None:
                updates.append(f"name = ${param_count}")
                params.append(workspace_data.name)
                param_count += 1
            
            if workspace_data.description is not None:
                updates.append(f"description = ${param_count}")
                params.append(workspace_data.description)
                param_count += 1
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            updates.append("updated_at = NOW()")
            
            # Update workspace
            query = f"""
                UPDATE workspaces 
                SET {', '.join(updates)}
                WHERE id = $1
                RETURNING id, name, description, created_at
            """
            
            result = await conn.fetchrow(query, *params)
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Workspace not found"
                )
            
            # Get member count
            member_count = await conn.fetchval(
                "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1",
                workspace_id
            )
            
            return WorkspaceResponse(
                id=str(result["id"]),
                name=result["name"],
                description=result["description"],
                role="owner",
                member_count=member_count,
                created_at=result["created_at"].isoformat()
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update workspace error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workspace: {str(e)}"
        )


# ================================
# Get Workspace Details
# ================================
@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get details of a specific workspace
    Verifies user has access to the workspace
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Verify membership and get workspace details
            row = await conn.fetchrow(
                """
                SELECT 
                    w.id, w.name, w.description, w.created_at, w.created_by,
                    wm.role,
                    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
                    u.email as owner_email,
                    u.raw_user_meta_data->>'full_name' as owner_name
                FROM workspaces w
                JOIN workspace_members wm ON w.id = wm.workspace_id
                LEFT JOIN auth.users u ON w.created_by = u.id
                WHERE w.id = $1 AND wm.user_id = $2
                """,
                workspace_id,
                current_user["id"]
            )
            
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this workspace"
                )
            
            return WorkspaceResponse(
                id=str(row["id"]),
                name=row["name"],
                description=row["description"],
                role=row["role"],
                member_count=row["member_count"],
                created_at=row["created_at"].isoformat(),
                owner_id=str(row["created_by"]) if row["created_by"] else None,
                owner_name=row["owner_name"],
                owner_email=row["owner_email"]
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get workspace error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workspace: {str(e)}"
        )


# ================================
# Get Workspace Members
# ================================
@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def get_workspace_members(
    workspace_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all members of a workspace
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Verify user is a member
            is_member = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM workspace_members WHERE workspace_id = $1::uuid AND user_id = $2::uuid)",
                workspace_id,
                current_user["id"]
            )
            
            if not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this workspace"
                )
            
            # Get members
            rows = await conn.fetch(
                """
                SELECT 
                    wm.id, wm.user_id, wm.role, wm.joined_at,
                    u.email,
                    u.raw_user_meta_data->>'full_name' as full_name
                FROM workspace_members wm
                JOIN auth.users u ON wm.user_id = u.id
                WHERE wm.workspace_id = $1
                ORDER BY wm.joined_at ASC
                """,
                workspace_id
            )
            
            members = []
            for row in rows:
                members.append(WorkspaceMemberResponse(
                    id=str(row["id"]),
                    user_id=str(row["user_id"]),
                    email=row["email"],
                    full_name=row["full_name"] or "Unknown User",
                    role=row["role"],
                    joined_at=row["joined_at"].isoformat()
                ))
            
            return members
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get workspace members error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workspace members: {str(e)}"
        )
