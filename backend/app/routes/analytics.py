from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import AnalyticsDashboard
from app.core.security import get_current_user, get_user_workspace, get_supabase_client
from app.core.workspace_middleware import get_workspace_id
from app.models.database import db
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboard)
async def get_dashboard_analytics(
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get analytics dashboard data with optimized queries"""
    try:
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Single query to get all counts
            stats = await conn.fetchrow(
                """
                SELECT 
                    (SELECT COUNT(*) FROM documents WHERE workspace_id = $1) as total_documents,
                    (SELECT COUNT(*) FROM query_logs WHERE workspace_id = $1) as total_queries,
                    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1) as team_members
                """,
                workspace_id
            )
            
            # Get recent activity (last 10 queries)
            recent_queries = await conn.fetch(
                """
                SELECT query, created_at
                FROM query_logs
                WHERE workspace_id = $1
                ORDER BY created_at DESC
                LIMIT 10
                """,
                workspace_id
            )
            
            recent_activity = [
                {
                    "type": "query",
                    "description": f"Asked: {row['query'][:50]}{'...' if len(row['query']) > 50 else ''}",
                    "timestamp": row["created_at"].isoformat()
                }
                for row in recent_queries
            ]
            
            # Get top queries with proper aggregation
            top_queries_data = await conn.fetch(
                """
                SELECT query, COUNT(*) as count
                FROM query_logs
                WHERE workspace_id = $1
                GROUP BY query
                ORDER BY count DESC
                LIMIT 5
                """,
                workspace_id
            )
            
            top_queries = [
                {"query": row["query"], "count": row["count"]}
                for row in top_queries_data
            ]
            
            # Get most accessed documents (by chunk count)
            most_accessed = await conn.fetch(
                """
                SELECT d.name as document_name, COUNT(dc.id) as access_count
                FROM documents d
                LEFT JOIN document_chunks dc ON d.id = dc.document_id
                WHERE d.workspace_id = $1
                GROUP BY d.id, d.name
                ORDER BY access_count DESC
                LIMIT 5
                """,
                workspace_id
            )
            
            most_accessed_documents = [
                {"document_name": row["document_name"], "access_count": row["access_count"]}
                for row in most_accessed
            ]
        
        return AnalyticsDashboard(
            total_documents=stats["total_documents"],
            total_queries=stats["total_queries"],
            team_members=stats["team_members"],
            recent_activity=recent_activity,
            top_queries=top_queries,
            most_accessed_documents=most_accessed_documents
        )
        
    except Exception as e:
        logger.error(f"Get analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/time-series")
async def get_time_series_analytics(
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user),
    days: int = 30
):
    """Get time-series analytics data for charts"""
    try:
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            # Queries over time (last N days)
            queries_over_time = await conn.fetch(
                """
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM query_logs
                WHERE workspace_id = $1 
                AND created_at >= NOW() - INTERVAL '1 day' * $2
                GROUP BY DATE(created_at)
                ORDER BY date ASC
                """,
                workspace_id,
                days
            )
            
            # Document uploads over time
            documents_over_time = await conn.fetch(
                """
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM documents
                WHERE workspace_id = $1 
                AND created_at >= NOW() - INTERVAL '1 day' * $2
                GROUP BY DATE(created_at)
                ORDER BY date ASC
                """,
                workspace_id,
                days
            )
            
            # Query distribution by user
            user_activity = await conn.fetch(
                """
                SELECT 
                    u.email,
                    u.raw_user_meta_data->>'full_name' as full_name,
                    COUNT(ql.id) as query_count
                FROM query_logs ql
                JOIN auth.users u ON ql.user_id = u.id
                WHERE ql.workspace_id = $1
                GROUP BY u.id, u.email, u.raw_user_meta_data
                ORDER BY query_count DESC
                LIMIT 10
                """,
                workspace_id
            )
            
            # Document usage statistics
            document_stats = await conn.fetch(
                """
                SELECT 
                    d.name,
                    d.file_type,
                    COUNT(dc.id) as chunk_count,
                    d.created_at
                FROM documents d
                LEFT JOIN document_chunks dc ON d.id = dc.document_id
                WHERE d.workspace_id = $1
                GROUP BY d.id, d.name, d.file_type, d.created_at
                ORDER BY chunk_count DESC
                """,
                workspace_id
            )
        
        return {
            "queries_over_time": [
                {"date": row["date"].isoformat(), "count": row["count"]}
                for row in queries_over_time
            ],
            "documents_over_time": [
                {"date": row["date"].isoformat(), "count": row["count"]}
                for row in documents_over_time
            ],
            "user_activity": [
                {
                    "name": row["full_name"] or row["email"],
                    "email": row["email"],
                    "query_count": row["query_count"]
                }
                for row in user_activity
            ],
            "document_stats": [
                {
                    "name": row["name"],
                    "file_type": row["file_type"],
                    "chunk_count": row["chunk_count"],
                    "created_at": row["created_at"].isoformat()
                }
                for row in document_stats
            ]
        }
        
    except Exception as e:
        logger.error(f"Get time-series analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get time-series analytics: {str(e)}"
        )
