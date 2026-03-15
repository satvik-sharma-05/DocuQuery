-- Migration script to update from Cohere (1024d) to OpenRouter/OpenAI (1536d) embeddings
-- This will drop existing embeddings and update the vector dimension
-- Run this script in Supabase SQL Editor

-- Step 1: Drop existing embeddings (they need to be regenerated anyway)
UPDATE document_chunks SET embedding = NULL;

-- Step 2: Alter the embedding column to use 1536 dimensions
ALTER TABLE document_chunks 
ALTER COLUMN embedding TYPE vector(1536);

-- Step 3: Drop and recreate the vector index with new dimensions
DROP INDEX IF EXISTS idx_document_chunks_embedding;

CREATE INDEX idx_document_chunks_embedding 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Verify the changes
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_name = 'document_chunks' 
AND column_name = 'embedding';

-- Step 5: Check index
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'document_chunks';

-- Note: After running this migration, you need to:
-- 1. Re-upload all documents OR
-- 2. Run a script to regenerate embeddings for existing documents
