from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import WorkspaceResponse, WorkspaceMember, InviteMember, MessageResponse
from app.core.security import get_current_user, get_user_workspace, get_supabase_client
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workspace", tags=["Workspace"])

@router.get("/me", response_model=WorkspaceResponse)
async def get_my_workspace(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user's workspace information"""
    try:
        workspace_info = await get_user_workspace(current_user)
        workspace = workspace_info["workspace"]
        
        return WorkspaceResponse(
            id=workspace["id"],
            name=workspace["name"],
            created_at=workspace["created_at"] if isinstance(workspace["created_at"], str) else workspace["created_at"].isoformat(),
            role=workspace_info["role"]
        )
        
    except Exception as e:
        logger.error(f"Get workspace error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workspace: {str(e)}"
        )

@router.get("/members", response_model=List[WorkspaceMember])
async def get_workspace_members(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all members of the current user's workspace"""
    try:
        workspace_info = await get_user_workspace(current_user)
        workspace_id = workspace_info["workspace_id"]
        
        supabase = get_supabase_client()
        
        # Get workspace members with user details
        members_response = supabase.table("workspace_members").select(
            "id, user_id, role, joined_at"
        ).eq("workspace_id", workspace_id).execute()
        
        if not members_response.data:
            return []
        
        members = []
        for member in members_response.data:
            try:
                # Get user details from auth.users using the admin API
                user = supabase.auth.admin.get_user_by_id(member["user_id"])
                
                if user and user.user:
                    members.append(WorkspaceMember(
                        id=member["id"],
                        user_id=member["user_id"],
                        email=user.user.email or "",
                        full_name=user.user.user_metadata.get("full_name", "") if user.user.user_metadata else "",
                        role=member["role"],
                        joined_at=member["joined_at"] if isinstance(member["joined_at"], str) else member["joined_at"].isoformat()
                    ))
            except Exception as user_error:
                # If we can't get user details, skip this member
                logger.warning(f"Could not fetch user details for {member['user_id']}: {str(user_error)}")
                # Add member with minimal info
                members.append(WorkspaceMember(
                    id=member["id"],
                    user_id=member["user_id"],
                    email="Unknown",
                    full_name="Unknown User",
                    role=member["role"],
                    joined_at=member["joined_at"] if isinstance(member["joined_at"], str) else member["joined_at"].isoformat()
                ))
        
        return members
        
    except Exception as e:
        logger.error(f"Get workspace members error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workspace members: {str(e)}"
        )

@router.post("/invite", response_model=MessageResponse)
async def invite_member(
    invite_data: InviteMember,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Invite a new member to the workspace"""
    try:
        workspace_info = await get_user_workspace(current_user)
        
        # Check if user has permission to invite (owner or admin)
        if workspace_info["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace owners and admins can invite members"
            )
        
        supabase = get_supabase_client()
        
        # Check if user already exists by trying to find them in auth.users
        try:
            # List all users and find by email (Supabase admin API)
            # Note: This is a workaround since there's no direct "get user by email" method
            existing_user = None
            
            # Try to get user by email using a database query on auth.users
            # This requires service role key
            from app.models.database import db
            pool = await db.get_pool()
            
            async with pool.acquire() as conn:
                user_row = await conn.fetchrow(
                    "SELECT id, email FROM auth.users WHERE email = $1",
                    invite_data.email
                )
                
                if user_row:
                    existing_user_id = str(user_row["id"])
                    
                    # Check if already a member
                    member_check = supabase.table("workspace_members").select("*").eq(
                        "workspace_id", workspace_info["workspace_id"]
                    ).eq("user_id", existing_user_id).execute()
                    
                    if member_check.data:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="User is already a member of this workspace"
                        )
                    
                    # Add existing user to workspace
                    await conn.execute(
                        """
                        INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
                        VALUES ($1, $2, $3, NOW())
                        """,
                        workspace_info["workspace_id"],
                        existing_user_id,
                        invite_data.role
                    )
                    
                    return MessageResponse(message=f"User {invite_data.email} added to workspace")
                else:
                    # User doesn't exist yet
                    return MessageResponse(
                        message=f"User with email {invite_data.email} not found. They need to register first."
                    )
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Invite member error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to invite member: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Invite member error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invite member: {str(e)}"
        )