from fastapi import APIRouter, HTTPException, Depends, status, Form
from app.models.schemas import SlackCommand, MessageResponse
from app.core.security import get_supabase_client
from app.services.rag_pipeline import rag_pipeline
from app.core.config import settings
import hmac
import hashlib
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/slack", tags=["Slack"])

def verify_slack_signature(body: bytes, timestamp: str, signature: str) -> bool:
    """Verify Slack request signature"""
    if not settings.SLACK_SIGNING_SECRET:
        return False
    
    basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
    my_signature = 'v0=' + hmac.new(
        settings.SLACK_SIGNING_SECRET.encode(),
        basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(my_signature, signature)

@router.post("/command")
async def slack_command(
    token: str = Form(...),
    team_id: str = Form(...),
    team_domain: str = Form(...),
    channel_id: str = Form(...),
    channel_name: str = Form(...),
    user_id: str = Form(...),
    user_name: str = Form(...),
    command: str = Form(...),
    text: str = Form(...),
    response_url: str = Form(...),
    trigger_id: str = Form(...)
):
    """Handle Slack slash commands"""
    try:
        # Verify token (basic verification)
        if token != settings.SLACK_BOT_TOKEN.split('-')[-1]:  # Last part of bot token
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Slack token"
            )
        
        if not text.strip():
            return {
                "response_type": "ephemeral",
                "text": "Please provide a question to search your documents. Example: `/docuquery What is our refund policy?`"
            }
        
        # For now, we'll use a default workspace
        # In production, you'd map Slack teams to workspaces
        supabase = get_supabase_client()
        
        # Get first available workspace (simplified for demo)
        workspace_response = supabase.table("workspaces").select("*").limit(1).execute()
        
        if not workspace_response.data:
            return {
                "response_type": "ephemeral",
                "text": "No workspace found. Please set up DocuQuery first."
            }
        
        workspace_id = workspace_response.data[0]["id"]
        
        # Process query using RAG
        try:
            answer, sources = await rag_pipeline.query(text, workspace_id)
            
            # Format response for Slack
            source_text = ""
            if sources:
                source_text = "\n\n*Sources:*\n" + "\n".join([
                    f"• {source['document_name']}"
                    for source in sources[:3]  # Show top 3 sources
                ])
            
            response_text = f"{answer}{source_text}"
            
            return {
                "response_type": "in_channel",
                "text": response_text
            }
            
        except Exception as e:
            logger.error(f"RAG query error in Slack: {str(e)}")
            return {
                "response_type": "ephemeral",
                "text": "Sorry, I couldn't process your question right now. Please try again later."
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Slack command error: {str(e)}")
        return {
            "response_type": "ephemeral",
            "text": "An error occurred while processing your request."
        }