from fastapi import APIRouter, HTTPException, Depends, status
from app.core.security import get_current_user
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# ================================
# Schemas
# ================================
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]]
    read: bool
    created_at: str


class MarkReadResponse(BaseModel):
    message: str


# ================================
# Get All Notifications
# ================================
@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all notifications for the current user
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, type, title, message, data, read, created_at
                FROM notifications
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 50
                """,
                current_user["id"]
            )
            
            notifications = []
            for row in rows:
                notifications.append(NotificationResponse(
                    id=str(row["id"]),
                    type=row["type"],
                    title=row["title"],
                    message=row["message"],
                    data=row["data"],
                    read=row["read"],
                    created_at=row["created_at"].isoformat()
                ))
            
            return notifications
        
    except Exception as e:
        logger.error(f"Get notifications error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get notifications: {str(e)}"
        )


# ================================
# Get Unread Notifications
# ================================
@router.get("/unread", response_model=List[NotificationResponse])
async def get_unread_notifications(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get unread notifications for the current user
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, type, title, message, data, read, created_at
                FROM notifications
                WHERE user_id = $1::uuid AND read = FALSE
                ORDER BY created_at DESC
                """,
                current_user["id"]
            )
            
            notifications = []
            for row in rows:
                notifications.append(NotificationResponse(
                    id=str(row["id"]),
                    type=row["type"],
                    title=row["title"],
                    message=row["message"],
                    data=row["data"],
                    read=row["read"],
                    created_at=row["created_at"].isoformat()
                ))
            
            return notifications
        
    except Exception as e:
        logger.error(f"Get unread notifications error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get unread notifications: {str(e)}"
        )


# ================================
# Mark Notification as Read
# ================================
@router.put("/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Mark a notification as read
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE notifications
                SET read = TRUE
                WHERE id = $1 AND user_id = $2
                """,
                notification_id,
                current_user["id"]
            )
            
            if result == "UPDATE 0":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found"
                )
        
        return MarkReadResponse(message="Notification marked as read")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark notification read error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )


# ================================
# Mark All Notifications as Read
# ================================
@router.put("/read-all", response_model=MarkReadResponse)
async def mark_all_notifications_read(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Mark all notifications as read for the current user
    """
    try:
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE notifications
                SET read = TRUE
                WHERE user_id = $1::uuid AND read = FALSE
                """,
                current_user["id"]
            )
        
        return MarkReadResponse(message="All notifications marked as read")
        
    except Exception as e:
        logger.error(f"Mark all notifications read error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark all notifications as read: {str(e)}"
        )
