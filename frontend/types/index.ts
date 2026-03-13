export interface User {
    id: string
    email: string
    full_name?: string
    workspace_id?: string
    workspace_name?: string
    role?: string
    created_at?: string
}

export interface AuthResponse {
    user: User
    access_token: string
    refresh_token: string
    token_type: string
}

export interface Workspace {
    id: string
    name: string
    description?: string
    role: string
    member_count: number
    document_count?: number
    created_at: string
    owner_id?: string
    owner_name?: string
    owner_email?: string
}

export interface WorkspaceMember {
    id: string
    user_id: string
    email: string
    full_name?: string
    role: string
    joined_at: string
}

export interface Document {
    id: string
    workspace_id: string
    name: string
    description?: string  // NEW: Document description
    file_path: string
    uploaded_by: string
    uploader_name?: string
    created_at: string
    chunk_count?: number
}

export interface Invitation {
    id: string
    workspace_id: string
    workspace_name: string
    invited_email: string
    invited_by: string
    inviter_name: string
    role: string
    status: string
    message?: string
    expires_at: string
    created_at: string
}

export interface Notification {
    id: string
    type: string
    title: string
    message: string
    data?: any
    read: boolean
    created_at: string
}

export interface ChatMessage {
    id: string
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

export interface ChatResponse {
    answer: string
    sources: Array<{
        document_id: string
        document_name: string
        content_preview: string
        relevance_score: number
    }>
    conversation_id: string
    message_id: string
}

export interface Conversation {
    id: string
    workspace_id: string
    user_id: string
    title?: string
    created_at: string
    messages?: ChatMessage[]
}

export interface Analytics {
    total_documents: number
    total_queries: number
    team_members: number
    recent_activity: Array<{
        type: string
        description: string
        timestamp: string
    }>
    top_queries: Array<{
        query: string
        count: number
    }>
    most_accessed_documents: Array<{
        document_name: string
        access_count: number
    }>
}


export interface TimeSeriesAnalytics {
    queries_over_time: Array<{
        date: string
        count: number
    }>
    documents_over_time: Array<{
        date: string
        count: number
    }>
    user_activity: Array<{
        name: string
        email: string
        query_count: number
    }>
    document_stats: Array<{
        name: string
        file_type: string
        chunk_count: number
        created_at: string
    }>
}
