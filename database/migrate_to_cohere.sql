-- Migration script to update from Gemini (768d) to Cohere (1024d) embeddings
-- Run this script in Supabase SQL Editor

-- Step 1: Create a backup table (optional)
CREATE TABLE IF NOT EXISTS document_chunks_backup AS 
SELECT * FROM document_chunks;

-- Step 2: Drop the existing embedding column
ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding;

-- Step 3: Add the new embedding column with 1024 dimensions
ALTER TABLE document_chunks ADD COLUMN embedding VECTOR(1024);

-- Step 4: Update the vector index
DROP INDEX IF EXISTS idx_document_chunks_embedding;
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Note: After running this migration, you'll need to:
-- 1. Re-upload documents to generate new Cohere embeddings
-- 2. Or run a script to regenerate embeddings for existing documents