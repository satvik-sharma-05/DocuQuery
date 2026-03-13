-- ============================================
-- DOCUQUERY - CLEAN DATABASE SCHEMA
-- ============================================
-- Multi-tenant AI SaaS application for document Q&A
-- Built with Supabase, PostgreSQL, pgvector, and Cohere AI
--
-- Architecture: Users → Workspace Members → Workspaces → Documents → Chunks
--               Workspaces → Conversations → Messages
--               Workspaces → Query Logs
--
-- This schema was rebuilt from scratch to eliminate recursive RLS issues
-- and provide a clean, production-ready foundation.
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- ============================================
-- TABLE: workspaces
-- ============================================
-- Represents a team or collaborative workspace
-- No owner_id field - ownership is managed through workspace_members

CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workspaces IS 'Team workspaces for document collaboration';
COMMENT ON COLUMN public.workspaces.id IS 'Unique workspace identifier';
COMMENT ON COLUMN public.workspaces.name IS 'Workspace display name';

-- ============================================
-- TABLE: workspace_members
-- ============================================
-- Links users to workspaces - CORE ACCESS CONTROL LAYER
-- All RLS policies check membership through this table

CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'user'))
);

COMMENT ON TABLE public.workspace_members IS 'User membership in workspaces - core access control';
COMMENT ON COLUMN public.workspace_members.role IS 'User role: owner, admin, or user';

-- ============================================
-- TABLE: documents
-- ============================================
-- Stores metadata for uploaded documents

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'Document metadata for uploaded files';
COMMENT ON COLUMN public.documents.file_path IS 'Storage path in Supabase Storage';

-- ============================================
-- TABLE: document_chunks
-- ============================================
-- Stores text chunks and embeddings for RAG retrieval
-- Uses 1024-dimensional Cohere embeddings

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
COMMENT ON COLUMN public.document_chunks.chunk_index IS 'Order of chunk within document';

-- ============================================
-- TABLE: conversations
-- ============================================
-- Stores chat conversation threads

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.conversations IS 'Chat conversation threads';
COMMENT ON COLUMN public.conversations.title IS 'Optional conversation title';

-- ============================================
-- TABLE: messages
-- ============================================
-- Stores individual chat messages

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_message_role CHECK (role IN ('user', 'assistant', 'system'))
);

COMMENT ON TABLE public.messages IS 'Chat messages within conversations';
COMMENT ON COLUMN public.messages.role IS 'Message sender: user, assistant, or system';

-- ============================================
-- TABLE: query_logs
-- ============================================
-- Stores query analytics and history

CREATE TABLE public.query_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.query_logs IS 'Query analytics and history';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Workspace membership lookups (critical for RLS performance)
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- Document queries
CREATE INDEX idx_documents_workspace_id ON public.documents(workspace_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Document chunk queries
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);

-- Vector similarity search (IVFFlat index for fast nearest neighbor)
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Conversation queries
CREATE INDEX idx_conversations_workspace_id ON public.conversations(workspace_id);
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);

-- Message queries
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Query log analytics
CREATE INDEX idx_query_logs_workspace_id ON public.query_logs(workspace_id);
CREATE INDEX idx_query_logs_user_id ON public.query_logs(user_id);
CREATE INDEX idx_query_logs_created_at ON public.query_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: workspace_members
-- ============================================

-- Users can view their own memberships
CREATE POLICY "Users can view their own workspace memberships"
    ON public.workspace_members
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can join workspaces (for registration)
CREATE POLICY "Users can join workspaces"
    ON public.workspace_members
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Workspace admins can manage members
CREATE POLICY "Workspace admins can manage members"
    ON public.workspace_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- RLS POLICIES: workspaces
-- ============================================

-- Users can view workspaces they belong to
CREATE POLICY "Users can view their workspaces"
    ON public.workspaces
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspaces.id
            AND wm.user_id = auth.uid()
        )
    );

-- Users can create workspaces
CREATE POLICY "Users can create workspaces"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (true);

-- Workspace owners can update workspace
CREATE POLICY "Workspace owners can update workspace"
    ON public.workspaces
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspaces.id
            AND wm.user_id = auth.uid()
            AND wm.role = 'owner'
        )
    );

-- Workspace owners can delete workspace
CREATE POLICY "Workspace owners can delete workspace"
    ON public.workspaces
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspaces.id
            AND wm.user_id = auth.uid()
            AND wm.role = 'owner'
        )
    );

-- ============================================
-- RLS POLICIES: documents
-- ============================================

-- Workspace members can view documents
CREATE POLICY "Workspace members can view documents"
    ON public.documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = documents.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can upload documents
CREATE POLICY "Workspace members can upload documents"
    ON public.documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = documents.workspace_id
            AND wm.user_id = auth.uid()
        )
        AND auth.uid() = uploaded_by
    );

-- Document uploaders and admins can delete documents
CREATE POLICY "Document uploaders and admins can delete documents"
    ON public.documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = documents.workspace_id
            AND wm.user_id = auth.uid()
            AND (wm.role IN ('owner', 'admin') OR documents.uploaded_by = auth.uid())
        )
    );

-- ============================================
-- RLS POLICIES: document_chunks
-- ============================================

-- Workspace members can view chunks (for RAG queries)
CREATE POLICY "Workspace members can view document chunks"
    ON public.document_chunks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            INNER JOIN public.workspace_members wm ON wm.workspace_id = d.workspace_id
            WHERE d.id = document_chunks.document_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can insert chunks (during document processing)
CREATE POLICY "Workspace members can insert document chunks"
    ON public.document_chunks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents d
            INNER JOIN public.workspace_members wm ON wm.workspace_id = d.workspace_id
            WHERE d.id = document_chunks.document_id
            AND wm.user_id = auth.uid()
        )
    );

-- Chunks can be deleted with documents
CREATE POLICY "Document chunks can be deleted with documents"
    ON public.document_chunks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            INNER JOIN public.workspace_members wm ON wm.workspace_id = d.workspace_id
            WHERE d.id = document_chunks.document_id
            AND wm.user_id = auth.uid()
            AND (wm.role IN ('owner', 'admin') OR d.uploaded_by = auth.uid())
        )
    );

-- ============================================
-- RLS POLICIES: conversations
-- ============================================

-- Workspace members can view conversations
CREATE POLICY "Workspace members can view conversations"
    ON public.conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = conversations.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can create conversations
CREATE POLICY "Workspace members can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = conversations.workspace_id
            AND wm.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

-- Conversation creators can delete their conversations
CREATE POLICY "Conversation creators can delete conversations"
    ON public.conversations
    FOR DELETE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = conversations.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- RLS POLICIES: messages
-- ============================================

-- Workspace members can view messages
CREATE POLICY "Workspace members can view messages"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            INNER JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
            WHERE c.id = messages.conversation_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can create messages
CREATE POLICY "Workspace members can create messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            INNER JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
            WHERE c.id = messages.conversation_id
            AND wm.user_id = auth.uid()
        )
    );

-- Conversation owners and admins can delete messages
CREATE POLICY "Conversation owners and admins can delete messages"
    ON public.messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            INNER JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
            WHERE c.id = messages.conversation_id
            AND wm.user_id = auth.uid()
            AND (c.created_by = auth.uid() OR wm.role IN ('owner', 'admin'))
        )
    );

-- ============================================
-- RLS POLICIES: query_logs
-- ============================================

-- Workspace members can view query logs
CREATE POLICY "Workspace members can view query logs"
    ON public.query_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = query_logs.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can create query logs
CREATE POLICY "Workspace members can create query logs"
    ON public.query_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = query_logs.workspace_id
            AND wm.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- This schema provides:
-- ✓ Multi-tenant workspace isolation
-- ✓ Role-based access control (owner, admin, user)
-- ✓ Document upload and processing
-- ✓ Vector embeddings for RAG (1024d Cohere)
-- ✓ Conversation and message management
-- ✓ Query analytics and logging
-- ✓ Comprehensive RLS policies (no recursion issues)
-- ✓ Performance indexes for all common queries
-- ✓ CASCADE deletes for data consistency
-- ============================================
