from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import UserRegister, UserLogin, AuthResponse, UserResponse, MessageResponse
from app.core.security import get_supabase_client, get_current_user, get_user_workspace
from app.models.database import db
from typing import Dict, Any, Optional
from pydantic import BaseModel
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Pydantic models for profile and settings
class ProfileUpdate(BaseModel):
    full_name: str

class UserSettings(BaseModel):
    notifications: Optional[Dict[str, bool]] = None
    privacy: Optional[Dict[str, Any]] = None
    appearance: Optional[Dict[str, str]] = None

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    """Register a new user and create their workspace"""
    try:
        supabase = get_supabase_client()
        
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        user_id = auth_response.user.id
        
        # Create workspace for the user using direct database access (bypasses RLS)
        workspace_id = str(uuid.uuid4())
        workspace_name = f"{user_data.full_name}'s Workspace"
        
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Insert workspace directly with created_by
            await conn.execute(
                """
                INSERT INTO workspaces (id, name, created_by, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                """,
                workspace_id,
                workspace_name,
                user_id
            )
            
            # Insert workspace member directly (id is auto-generated)
            await conn.execute(
                """
                INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (workspace_id, user_id) DO NOTHING
                """,
                workspace_id,
                user_id,
                "owner"
            )
        
        # Return user and token info
        return AuthResponse(
            user=UserResponse(
                id=user_id,
                email=auth_response.user.email,
                full_name=user_data.full_name,
                workspace_id=workspace_id,
                workspace_name=workspace_name,
                role="owner",
                created_at=auth_response.user.created_at.isoformat() if auth_response.user.created_at else None
            ),
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    """Login user with email and password"""
    try:
        supabase = get_supabase_client()
        
        # Authenticate with Supabase
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": user_data.email,
                "password": user_data.password
            })
        except Exception as auth_error:
            logger.error(f"Supabase auth error: {str(auth_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = auth_response.user
        
        # Get user's workspace
        try:
            workspace_info = await get_user_workspace({
                "id": user.id,
                "email": user.email,
                "user_metadata": user.user_metadata or {}
            })
        except Exception as workspace_error:
            logger.error(f"Workspace fetch error: {str(workspace_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch workspace: {str(workspace_error)}"
            )
        
        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.user_metadata.get("full_name", "") if user.user_metadata else "",
                workspace_id=workspace_info["workspace_id"],
                workspace_name=workspace_info["workspace"]["name"],
                role=workspace_info["role"],
                created_at=user.created_at.isoformat() if user.created_at else None
            ),
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout current user"""
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        
        return MessageResponse(message="Successfully logged out")
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    try:
        workspace_info = await get_user_workspace(current_user)
        
        return UserResponse(
            id=current_user["id"],
            email=current_user["email"],
            full_name=current_user["user_metadata"].get("full_name", ""),
            workspace_id=workspace_info["workspace_id"],
            workspace_name=workspace_info["workspace"]["name"],
            role=workspace_info["role"],
            created_at=current_user.get("created_at").isoformat() if current_user.get("created_at") else None
        )
        
    except Exception as e:
        logger.error(f"Get user info error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        supabase = get_supabase_client()
        
        # Update user metadata in Supabase Auth
        auth_response = supabase.auth.update_user({
            "data": {
                "full_name": profile_data.full_name
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update profile"
            )
        
        # Get updated workspace info
        workspace_info = await get_user_workspace(current_user)
        
        return UserResponse(
            id=current_user["id"],
            email=current_user["email"],
            full_name=profile_data.full_name,
            workspace_id=workspace_info["workspace_id"],
            workspace_name=workspace_info["workspace"]["name"],
            role=workspace_info["role"],
            created_at=current_user.get("created_at").isoformat() if current_user.get("created_at") else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.get("/settings")
async def get_user_settings(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get user settings"""
    try:
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Check if user settings exist
            settings_row = await conn.fetchrow(
                "SELECT settings FROM user_settings WHERE user_id = $1",
                current_user["id"]
            )
            
            if settings_row:
                return settings_row["settings"]
            else:
                # Return default settings
                return {
                    "notifications": {
                        "email": True,
                        "push": True,
                        "desktop": False,
                        "sound": True
                    },
                    "privacy": {
                        "profileVisibility": "team",
                        "activityStatus": True,
                        "dataSharing": False
                    },
                    "appearance": {
                        "theme": "system",
                        "language": "en",
                        "timezone": "UTC"
                    }
                }
                
    except Exception as e:
        logger.error(f"Get settings error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get settings: {str(e)}"
        )

@router.put("/settings", response_model=MessageResponse)
async def update_user_settings(
    settings_data: UserSettings,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update user settings"""
    try:
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Get current settings
            current_settings_row = await conn.fetchrow(
                "SELECT settings FROM user_settings WHERE user_id = $1",
                current_user["id"]
            )
            
            if current_settings_row:
                current_settings = current_settings_row["settings"]
            else:
                current_settings = {
                    "notifications": {
                        "email": True,
                        "push": True,
                        "desktop": False,
                        "sound": True
                    },
                    "privacy": {
                        "profileVisibility": "team",
                        "activityStatus": True,
                        "dataSharing": False
                    },
                    "appearance": {
                        "theme": "system",
                        "language": "en",
                        "timezone": "UTC"
                    }
                }
            
            # Merge new settings with current settings
            if settings_data.notifications:
                current_settings["notifications"].update(settings_data.notifications)
            if settings_data.privacy:
                current_settings["privacy"].update(settings_data.privacy)
            if settings_data.appearance:
                current_settings["appearance"].update(settings_data.appearance)
            
            # Upsert settings
            await conn.execute(
                """
                INSERT INTO user_settings (user_id, settings, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET settings = $2, updated_at = NOW()
                """,
                current_user["id"],
                current_settings
            )
            
        return MessageResponse(message="Settings updated successfully")
        
    except Exception as e:
        logger.error(f"Update settings error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )