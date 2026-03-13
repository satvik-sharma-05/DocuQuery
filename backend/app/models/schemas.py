from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    workspace_id: Optional[str] = None
    workspace_name: Optional[str] = None
    role: Optional[str] = None
    created_at: Optional[str] = None  # Changed to str

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Workspace Models
class WorkspaceResponse(BaseModel):
    id: str
    name: str
    created_at: str  # Changed to str
    role: str

class WorkspaceMember(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: str
    joined_at: str  # Changed to str

class InviteMember(BaseModel):
    email: EmailStr
    role: str = "member"

# Document Models
class DocumentUpload(BaseModel):
    name: str
    workspace_id: str

class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = ""
    file_path: str
    uploaded_by: str
    uploader_name: Optional[str] = None
    created_at: str  # Changed to str to handle ISO format from Supabase
    chunk_count: Optional[int] = 0

class DocumentChunk(BaseModel):
    id: str
    document_id: str
    content: str
    created_at: str  # Changed to str

# Chat Models
class ChatQuery(BaseModel):
    query: str
    conversation_id: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    conversation_id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str  # Changed to str for ISO format

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    conversation_id: str
    message_id: str

class ConversationResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    title: Optional[str] = None
    created_at: str  # Changed to str for ISO format
    messages: List[ChatMessage] = []

# Analytics Models
class AnalyticsDashboard(BaseModel):
    total_documents: int
    total_queries: int
    team_members: int
    recent_activity: List[Dict[str, Any]]
    top_queries: List[Dict[str, Any]]
    most_accessed_documents: List[Dict[str, Any]]

# Slack Models
class SlackCommand(BaseModel):
    token: str
    team_id: str
    team_domain: str
    channel_id: str
    channel_name: str
    user_id: str
    user_name: str
    command: str
    text: str
    response_url: str
    trigger_id: str

# Generic Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    detail: str
    success: bool = False