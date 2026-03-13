from fastapi import APIRouter, HTTPException, Depends, status
from app.core.security import get_current_user, get_supabase_client
from app.core.workspace_middleware import get_workspace_context
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, List, Optional
import uuid
import logging
from datetime import datetime, timedelta
import secrets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/invitations", tags=["Invitations"])


# ================================
# Schemas
# ================================
class SendInvitationRequest(BaseModel):
    email: EmailStr
    role: str = "member"
    message: Optional[str] = None


class InvitationResponse(BaseModel):
    id: str
    workspace_id: str
    workspace_name: str
    invited_email: str
    invited_by: str
    inviter_name: str
    role: str
    status: str
    message: Optional[str]
    expires_at: str
    created_at: str


class InvitationActionResponse(BaseModel):
    message: str
    workspace_id: Optional[str] = None


# ================================
# Send Invitation
# ================================
@router.post("/send", response_model=InvitationResponse)
async def send_invitation(
    invitation_data: SendInvitationRequest,
    workspace_context: Dict[str, Any] = Depends(get_workspace_context),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Send a workspace invitation to a user by email.
    Only workspace owners and admins can send invitations.
    """
    try:
        # Check permissions
        if workspace_context["role"] not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace owners and admins can send invitations"
            )
        
        # Validate role
        if invitation_data.role not in ["admin", "member"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin' or 'member'"
            )
        
        supabase = get_supabase_client()
        workspace_id = workspace_context["workspace_id"]
        
        # Check if user already exists and is a member
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Check if email exists in auth.users
            user_row = await conn.fetchrow(
                "SELECT id FROM auth.users WHERE email = $1",
                invitation_data.email
            )
            
            if user_row:
                # Check if already a member
                member_check = await conn.fetchrow(
                    "SELECT id FROM workspace_members WHERE workspace_id = $1::uuid AND user_id = $2::uuid",
                    workspace_id,
                    str(user_row["id"])
                )
                
                if member_check:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="User is already a member of this workspace"
                    )
            
            # Check for existing pending invitation
            existing_invitation = await conn.fetchrow(
                """
                SELECT id FROM workspace_invitations 
                WHERE workspace_id = $1 AND invited_email = $2 AND status = 'pending'
                """,
                workspace_id,
                invitation_data.email
            )
            
            if existing_invitation:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An invitation has already been sent to this email"
                )
            
            # Create invitation
            invitation_id = str(uuid.uuid4())
            token = secrets.token_urlsafe(32)
            from datetime import timezone
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            await conn.execute(
                """
                INSERT INTO workspace_invitations 
                (id, workspace_id, invited_email, invited_by, role, status, token, message, expires_at, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                """,
                invitation_id,
                workspace_id,
                invitation_data.email,
                current_user["id"],
                invitation_data.role,
                "pending",
                token,
                invitation_data.message,
                expires_at
            )
            
            # Create notification for invited user (if they exist)
            if user_row:
                notification_id = str(uuid.uuid4())
                await conn.execute(
                    """
                    INSERT INTO notifications 
                    (id, user_id, type, title, message, data, read, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    """,
                    notification_id,
                    str(user_row["id"]),
                    "invitation",
                    "Workspace Invitation",
                    f"You've been invited to join {workspace_context['workspace']['name']}",
                    f'{{"invitation_id": "{invitation_id}", "workspace_id": "{workspace_id}"}}',
                    False
                )
        
        # Get workspace name and inviter name
        workspace_name = workspace_context["workspace"]["name"]
        inviter_name = current_user.get("user_metadata", {}).get("full_name", current_user["email"])
        
        return InvitationResponse(
            id=invitation_id,
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            invited_email=invitation_data.email,
            invited_by=current_user["id"],
            inviter_name=inviter_name,
            role=invitation_data.role,
            status="pending",
            message=invitation_data.message,
            expires_at=expires_at.isoformat(),
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send invitation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send invitation: {str(e)}"
        )


# ================================
# Get User's Invitations
# ================================
@router.get("/pending", response_model=List[InvitationResponse])
async def get_pending_invitations(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all pending invitations for the current user
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    i.id, i.workspace_id, i.invited_email, i.invited_by, 
                    i.role, i.status, i.message, i.expires_at, i.created_at,
                    w.name as workspace_name,
                    u.email as inviter_email,
                    u.raw_user_meta_data->>'full_name' as inviter_name
                FROM workspace_invitations i
                JOIN workspaces w ON i.workspace_id = w.id
                JOIN auth.users u ON i.invited_by = u.id
                WHERE i.invited_email = $1 AND i.status = 'pending' AND i.expires_at > NOW()
                ORDER BY i.created_at DESC
                """,
                current_user["email"]
            )
            
            invitations = []
            for row in rows:
                invitations.append(InvitationResponse(
                    id=str(row["id"]),
                    workspace_id=str(row["workspace_id"]),
                    workspace_name=row["workspace_name"],
                    invited_email=row["invited_email"],
                    invited_by=str(row["invited_by"]),
                    inviter_name=row["inviter_name"] or row["inviter_email"],
                    role=row["role"],
                    status=row["status"],
                    message=row["message"],
                    expires_at=row["expires_at"].isoformat(),
                    created_at=row["created_at"].isoformat()
                ))
            
            return invitations
        
    except Exception as e:
        logger.error(f"Get invitations error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get invitations: {str(e)}"
        )


# ================================
# Accept Invitation
# ================================
@router.post("/{invitation_id}/accept", response_model=InvitationActionResponse)
async def accept_invitation(
    invitation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Accept a workspace invitation
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Get invitation
            invitation = await conn.fetchrow(
                """
                SELECT * FROM workspace_invitations 
                WHERE id = $1 AND invited_email = $2 AND status = 'pending'
                """,
                invitation_id,
                current_user["email"]
            )
            
            if not invitation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invitation not found or already processed"
                )
            
            # Check if expired (use timezone-aware datetime)
            from datetime import timezone
            if invitation["expires_at"] < datetime.now(timezone.utc):
                await conn.execute(
                    "UPDATE workspace_invitations SET status = 'expired' WHERE id = $1",
                    invitation_id
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invitation has expired"
                )
            
            # Add user to workspace
            member_id = str(uuid.uuid4())
            await conn.execute(
                """
                INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
                VALUES ($1, $2, $3, $4, NOW())
                """,
                member_id,
                str(invitation["workspace_id"]),
                current_user["id"],
                invitation["role"]
            )
            
            # Update invitation status
            await conn.execute(
                """
                UPDATE workspace_invitations 
                SET status = 'accepted', responded_at = NOW()
                WHERE id = $1
                """,
                invitation_id
            )
            
            # Create notification for inviter
            notification_id = str(uuid.uuid4())
            workspace_name = await conn.fetchval(
                "SELECT name FROM workspaces WHERE id = $1",
                str(invitation["workspace_id"])
            )
            
            await conn.execute(
                """
                INSERT INTO notifications 
                (id, user_id, type, title, message, data, read, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                """,
                notification_id,
                str(invitation["invited_by"]),
                "invitation_accepted",
                "Invitation Accepted",
                f"{current_user['email']} accepted your invitation to {workspace_name}",
                f'{{"workspace_id": "{str(invitation["workspace_id"])}"}}',
                False
            )
        
        return InvitationActionResponse(
            message="Invitation accepted successfully",
            workspace_id=str(invitation["workspace_id"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accept invitation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept invitation: {str(e)}"
        )


# ================================
# Reject Invitation
# ================================
@router.post("/{invitation_id}/reject", response_model=InvitationActionResponse)
async def reject_invitation(
    invitation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Reject a workspace invitation
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Get invitation
            invitation = await conn.fetchrow(
                """
                SELECT * FROM workspace_invitations 
                WHERE id = $1 AND invited_email = $2 AND status = 'pending'
                """,
                invitation_id,
                current_user["email"]
            )
            
            if not invitation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invitation not found or already processed"
                )
            
            # Update invitation status
            await conn.execute(
                """
                UPDATE workspace_invitations 
                SET status = 'rejected', responded_at = NOW()
                WHERE id = $1
                """,
                invitation_id
            )
            
            # Create notification for inviter
            notification_id = str(uuid.uuid4())
            workspace_name = await conn.fetchval(
                "SELECT name FROM workspaces WHERE id = $1",
                str(invitation["workspace_id"])
            )
            
            await conn.execute(
                """
                INSERT INTO notifications 
                (id, user_id, type, title, message, data, read, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                """,
                notification_id,
                str(invitation["invited_by"]),
                "invitation_rejected",
                "Invitation Rejected",
                f"{current_user['email']} declined your invitation to {workspace_name}",
                f'{{"workspace_id": "{str(invitation["workspace_id"])}"}}',
                False
            )
        
        return InvitationActionResponse(
            message="Invitation rejected"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject invitation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject invitation: {str(e)}"
        )
