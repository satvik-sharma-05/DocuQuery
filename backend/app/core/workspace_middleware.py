from fastapi import HTTPException, Depends, Header, status
from app.core.security import get_current_user, get_supabase_client
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


async def get_workspace_id(
    x_workspace_id: Optional[str] = Header(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """
    Extract and validate workspace ID from request headers.
    Verifies that the user has access to the workspace.
    
    Returns the workspace ID if valid, raises HTTPException otherwise.
    """
    if not x_workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace ID is required. Please select a workspace."
        )
    
    try:
        supabase = get_supabase_client()
        
        # Verify user is a member of this workspace
        response = (
            supabase.table("workspace_members")
            .select("role")
            .eq("workspace_id", x_workspace_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this workspace"
            )
        
        return x_workspace_id
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating workspace access: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate workspace access"
        )


async def get_workspace_context(
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get full workspace context including user role and workspace details.
    
    Returns a dictionary with workspace_id, user_id, and role.
    """
    try:
        supabase = get_supabase_client()
        
        # Get user's role in the workspace
        response = (
            supabase.table("workspace_members")
            .select("role, workspaces(id, name, created_at)")
            .eq("workspace_id", workspace_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this workspace"
            )
        
        member = response.data[0]
        workspace = member.get("workspaces")
        
        return {
            "workspace_id": workspace_id,
            "user_id": current_user["id"],
            "role": member["role"],
            "workspace": workspace
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workspace context: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get workspace context"
        )
