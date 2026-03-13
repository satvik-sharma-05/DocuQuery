-- ============================================
-- DOCUQUERY - PRODUCTION DATABASE SCHEMA
-- ============================================
-- Multi-tenant AI SaaS for collaborative document Q&A
-- Supports: Multiple workspaces per user, invitations, shared documents, private chats
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- ============================================
-- TABLE: workspaces
-- ============================================
-- Represents a team/collaborative workspace

CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workspaces IS 'Team workspaces for document collaboration';
COMMENT ON COLUMN public.workspaces.created_by IS 'User who created the workspace';

-- ============================================
-- TABLE: workspace_members
-- ============================================
-- Links users to workspaces with roles

CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

COMMENT ON TABLE public.workspace_members IS 'User membership in workspaces';
COMMENT ON COLUMN public.workspace_members.role IS 'User role: owner, admin, or member';

-- ============================================
-- TABLE: workspace_invitations
-- ============================================
-- Stores pending workspace invitations

CREATE TABLE public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    message TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT valid_invitation_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    CONSTRAINT valid_invitation_role CHECK (role IN ('admin', 'member'))
);

COMMENT ON TABLE public.workspace_invitations IS 'Pending workspace invitations';
COMMENT ON COLUMN public.workspace_invitations.status IS 'Invitation status: pending, accepted, rejected, expired';

CREATE INDEX idx_invitations_email ON public.workspace_invitations(invited_email);
CREATE INDEX idx_invitations_token ON public.workspace_invitations(token);
CREATE INDEX idx_invitations_workspace ON public.workspace_invitations(workspace_id);

-- ============================================
-- TABLE: documents
-- ============================================
-- Stores document metadata

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'Document metadata for uploaded files';
COMMENT ON COLUMN public.documents.description IS 'User-provided description of document content';
COMMENT ON COLUMN public.documents.file_path IS 'Storage path in Supabase Storage';

CREATE INDEX idx_documents_workspace ON public.documents(workspace_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

-- ============================================
-- TABLE: document_chunks
-- ============================================
-- Stores text chunks and embeddings for RAG

CREATE TABLE public.document_chunks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

COMMENT ON TABLE public.document_chunks IS 'Text chunks with 1024d Cohere embeddings for RAG';
COMMENT ON COLUMN public.document_chunks.embedding IS '1024-dimensional Cohere embedding vector';

CREATE INDEX idx_document_chunks_document ON public.document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- TABLE: conversations
-- ============================================
-- Stores chat conversation threads (private to user)

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.conversations IS 'Chat conversations (private to each user)';
COMMENT ON COLUMN public.conversations.user_id IS 'Owner of the conversation (private)';

CREATE INDEX idx_conversations_workspace ON public.conversations(workspace_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);

-- ============================================
-- TABLE: messages
-- ============================================
-- Stores individual chat messages

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_message_role CHECK (role IN ('user', 'assistant', 'system'))
);

COMMENT ON TABLE public.messages IS 'Chat messages within conversations';
COMMENT ON COLUMN public.messages.sources IS 'Referenced documents and chunks (for assistant messages)';

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- TABLE: query_logs
-- ============================================
-- Stores query analytics

CREATE TABLE public.query_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    response_time_ms INTEGER,
    chunks_retrieved INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.query_logs IS 'Query analytics and history';

CREATE INDEX idx_query_logs_workspace ON public.query_logs(workspace_id);
CREATE INDEX idx_query_logs_user ON public.query_logs(user_id);
CREATE INDEX idx_query_logs_created_at ON public.query_logs(created_at DESC);

-- ============================================
-- TABLE: notifications
-- ============================================
-- Stores in-app notifications

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'In-app notifications for users';
COMMENT ON COLUMN public.notifications.type IS 'Notification type: invitation, invitation_accepted, invitation_rejected, etc.';

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: workspaces
-- ============================================

CREATE POLICY "Users can view their workspaces"
    ON public.workspaces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspaces.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace owners can update"
    ON public.workspaces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspaces.id 
            AND user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- ============================================
-- RLS POLICIES: workspace_members
-- ============================================

CREATE POLICY "Users can view workspace members"
    ON public.workspace_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join workspaces"
    ON public.workspace_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: workspace_invitations
-- ============================================

CREATE POLICY "Users can view invitations sent to them"
    ON public.workspace_invitations FOR SELECT
    USING (
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        invited_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_invitations.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can create invitations"
    ON public.workspace_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_invitations.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- RLS POLICIES: documents
-- ============================================

CREATE POLICY "Workspace members can view documents"
    ON public.documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = documents.workspace_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can upload documents"
    ON public.documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = documents.workspace_id AND user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

-- ============================================
-- RLS POLICIES: conversations
-- ============================================

CREATE POLICY "Users can view their own conversations"
    ON public.conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = conversations.workspace_id AND user_id = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES: messages
-- ============================================

CREATE POLICY "Users can view their conversation messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES: notifications
-- ============================================

CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically add workspace creator as owner
CREATE OR REPLACE FUNCTION add_workspace_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_workspace_creator
    AFTER INSERT ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION add_workspace_creator_as_owner();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
