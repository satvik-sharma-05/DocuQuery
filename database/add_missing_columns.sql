-- Add missing columns to existing tables

-- Add description column to documents table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'description') THEN
        ALTER TABLE documents ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add title column to conversations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'title') THEN
        ALTER TABLE conversations ADD COLUMN title TEXT;
    END IF;
END $$;

-- Add chunk_index column to document_chunks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'document_chunks' AND column_name = 'chunk_index') THEN
        ALTER TABLE document_chunks ADD COLUMN chunk_index INTEGER DEFAULT 0;
    END IF;
END $$;