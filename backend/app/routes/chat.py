from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import ChatQuery, ChatResponse, ConversationResponse, ChatMessage, MessageResponse
from app.core.security import get_current_user, get_user_workspace, get_supabase_client
from app.core.workspace_middleware import get_workspace_id
from app.services.rag_pipeline import rag_pipeline
from typing import Dict, Any, List
from pydantic import BaseModel
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ConversationUpdate(BaseModel):
    title: str

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    query_data: ChatQuery,
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Ask a question using RAG"""
    try:
        logger.info(f"=== CHAT QUERY RECEIVED ===")
        logger.info(f"Query: {query_data.query}")
        logger.info(f"Workspace: {workspace_id}")
        logger.info(f"User: {current_user['id']}")
        logger.info(f"Conversation ID: {query_data.conversation_id}")
        
        supabase = get_supabase_client()
        
        # Get or create conversation
        conversation_id = query_data.conversation_id
        if not conversation_id:
            # Create new conversation
            conversation_data = {
                "id": str(uuid.uuid4()),
                "workspace_id": workspace_id,
                "user_id": current_user["id"]  # Changed from created_by to user_id
            }
            
            conv_response = supabase.table("conversations").insert(conversation_data).execute()
            
            if not conv_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create conversation"
                )
            
            conversation_id = conv_response.data[0]["id"]
        else:
            # Verify conversation belongs to user's workspace
            conv_check = supabase.table("conversations").select("*").eq("id", conversation_id).eq(
                "workspace_id", workspace_id
            ).execute()
            
            if not conv_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        
        # Save user message
        user_message_id = str(uuid.uuid4())
        user_message_data = {
            "id": user_message_id,
            "conversation_id": conversation_id,
            "role": "user",
            "content": query_data.query
        }
        
        supabase.table("messages").insert(user_message_data).execute()
        
        # Auto-generate conversation title from first message if not set
        conv_check = supabase.table("conversations").select("title").eq("id", conversation_id).execute()
        if conv_check.data and not conv_check.data[0].get("title"):
            # Generate title from first 50 characters of query
            title = query_data.query[:50] + ("..." if len(query_data.query) > 50 else "")
            supabase.table("conversations").update({"title": title}).eq("id", conversation_id).execute()
        
        # Log the query
        supabase.table("query_logs").insert({
            "workspace_id": workspace_id,
            "user_id": current_user["id"],
            "query": query_data.query
        }).execute()
        
        logger.info("Starting RAG pipeline query...")
        # Get RAG response
        answer, sources = await rag_pipeline.query(query_data.query, workspace_id)
        logger.info(f"RAG pipeline completed - Answer length: {len(answer)}, Sources: {len(sources)}")
        
        # Save assistant message
        assistant_message_id = str(uuid.uuid4())
        assistant_message_data = {
            "id": assistant_message_id,
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": answer
        }
        
        supabase.table("messages").insert(assistant_message_data).execute()
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            conversation_id=conversation_id,
            message_id=assistant_message_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}"
        )

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all conversations for the user"""
    try:
        
        supabase = get_supabase_client()
        
        # Get conversations
        conv_response = supabase.table("conversations").select("*").eq(
            "workspace_id", workspace_id
        ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()  # Changed from created_by to user_id
        
        conversations = []
        for conv in conv_response.data:
            conversations.append(ConversationResponse(
                id=conv["id"],
                workspace_id=conv["workspace_id"],
                user_id=conv["user_id"],
                title=conv.get("title"),
                created_at=conv["created_at"]  # Supabase returns ISO string
            ))
        
        return conversations
        
    except Exception as e:
        logger.error(f"Get conversations error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversations: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific conversation with messages"""
    try:
        
        supabase = get_supabase_client()
        
        # Get conversation
        conv_response = supabase.table("conversations").select("*").eq("id", conversation_id).eq(
            "workspace_id", workspace_id
        ).execute()
        
        if not conv_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        conv = conv_response.data[0]
        
        # Get messages
        messages_response = supabase.table("messages").select("*").eq(
            "conversation_id", conversation_id
        ).order("created_at", desc=False).execute()
        
        messages = []
        for msg in messages_response.data:
            messages.append(ChatMessage(
                id=msg["id"],
                conversation_id=msg["conversation_id"],
                role=msg["role"],
                content=msg["content"],
                timestamp=msg["created_at"]  # Supabase returns ISO string
            ))
        
        return ConversationResponse(
            id=conv["id"],
            workspace_id=conv["workspace_id"],
            user_id=conv["user_id"],
            title=conv.get("title"),
            created_at=conv["created_at"],  # Supabase returns ISO string
            messages=messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get conversation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation: {str(e)}"
        )

@router.put("/conversations/{conversation_id}", response_model=MessageResponse)
async def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update conversation title"""
    try:
        logger.info(f"Updating conversation {conversation_id} with title: {update_data.title}")
        supabase = get_supabase_client()
        
        # Verify conversation belongs to user's workspace
        conv_check = supabase.table("conversations").select("*").eq("id", conversation_id).eq(
            "workspace_id", workspace_id
        ).eq("user_id", current_user["id"]).execute()
        
        if not conv_check.data:
            logger.warning(f"Conversation {conversation_id} not found for user {current_user['id']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Update conversation title
        update_response = supabase.table("conversations").update({
            "title": update_data.title
        }).eq("id", conversation_id).execute()
        
        if not update_response.data:
            logger.error(f"Failed to update conversation {conversation_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update conversation"
            )
        
        logger.info(f"Successfully updated conversation {conversation_id}")
        return MessageResponse(message="Conversation updated successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update conversation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update conversation: {str(e)}"
        )

@router.delete("/conversations/{conversation_id}", response_model=MessageResponse)
async def delete_conversation(
    conversation_id: str,
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a conversation and all its messages"""
    try:
        supabase = get_supabase_client()
        
        # Verify conversation belongs to user's workspace
        conv_check = supabase.table("conversations").select("*").eq("id", conversation_id).eq(
            "workspace_id", workspace_id
        ).eq("user_id", current_user["id"]).execute()
        
        if not conv_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Delete conversation (messages will be deleted automatically due to CASCADE)
        delete_response = supabase.table("conversations").delete().eq("id", conversation_id).execute()
        
        if not delete_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete conversation"
            )
        
        return MessageResponse(message="Conversation deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete conversation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )


@router.delete("/conversations/{conversation_id}", response_model=MessageResponse)
async def delete_conversation(
    conversation_id: str,
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a conversation and all its messages"""
    try:
        supabase = get_supabase_client()

        # Verify conversation belongs to user's workspace
        conv_check = supabase.table("conversations").select("*").eq("id", conversation_id).eq(
            "workspace_id", workspace_id
        ).eq("user_id", current_user["id"]).execute()

        if not conv_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Delete conversation (messages will be deleted automatically due to CASCADE)
        delete_response = supabase.table("conversations").delete().eq("id", conversation_id).execute()

        if not delete_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete conversation"
            )

        return MessageResponse(message="Conversation deleted successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete conversation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )
