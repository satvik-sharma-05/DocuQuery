from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, BackgroundTasks
from app.models.schemas import DocumentResponse, MessageResponse
from app.core.security import get_current_user, get_user_workspace, get_supabase_client
from app.core.workspace_middleware import get_workspace_id
from app.services.document_processor import document_processor
from app.services.embedding_service import embedding_service
from app.core.config import settings

from typing import Dict, Any, List
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["Documents"])


# ================================
# Background Processing Function
# ================================
async def process_document_chunks(
    document_id: str,
    workspace_id: str,
    text_content: str
):
    """Process document chunks in background"""
    try:
        logger.info(f"Background processing started for document {document_id}")
        
        # Validate text content
        if not text_content or len(text_content.strip()) < 10:
            logger.error(f"Document {document_id} has insufficient text content")
            return
        
        # Chunk document
        chunks = document_processor.chunk_text(text_content)
        logger.info(f"Created {len(chunks)} chunks from document")

        if not chunks:
            logger.error(f"No chunks created for document {document_id}")
            return

        chunk_count = 0
        chunk_rows = []
        failed_chunks = 0

        for i, chunk_text in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)} for document {document_id}")
                
                # Validate chunk content
                if not chunk_text or len(chunk_text.strip()) < 10:
                    logger.warning(f"Skipping chunk {i+1} - insufficient content")
                    continue
                
                embedding = await embedding_service.generate_embedding(chunk_text)
                logger.info(f"Generated embedding with {len(embedding)} dimensions")
                
                # Validate embedding
                if not embedding or len(embedding) != 1024:
                    logger.error(f"Invalid embedding for chunk {i+1}: expected 1024 dimensions, got {len(embedding) if embedding else 0}")
                    failed_chunks += 1
                    continue
                
                # Convert embedding list to PostgreSQL vector format
                embedding_str = "[" + ",".join(map(str, embedding)) + "]"

                chunk_rows.append({
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "chunk_index": i,
                    "content": chunk_text,
                    "embedding": embedding_str
                })

                chunk_count += 1

            except Exception as e:
                failed_chunks += 1
                logger.error(f"Chunk {i+1} embedding failed: {str(e)}", exc_info=True)

        logger.info(f"Successfully processed {chunk_count} chunks, {failed_chunks} failed")

        # Bulk insert chunks
        if chunk_rows:
            try:
                supabase = get_supabase_client()
                logger.info(f"Inserting {len(chunk_rows)} chunks into database...")
                result = supabase.table("document_chunks").insert(chunk_rows).execute()
                
                if result.data:
                    logger.info(f"Successfully inserted {len(result.data)} chunks for document {document_id}")
                else:
                    logger.error(f"Insert returned no data for document {document_id}")
                    
            except Exception as e:
                logger.error(f"Failed to insert chunks: {str(e)}", exc_info=True)
                # Try to get more details about the error
                if hasattr(e, 'response'):
                    logger.error(f"Error response: {e.response}")
        else:
            logger.error(f"No chunks were successfully processed for document {document_id}")
            
    except Exception as e:
        logger.error(f"Background processing error for document {document_id}: {str(e)}", exc_info=True)


# ================================
# Upload Document
# ================================
@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    description: str = File(...),  # NEW: Required description
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload and process a document (processing happens in background)"""

    try:
        logger.info(f"Starting document upload for file: {file.filename}")
        
        workspace_info = await get_user_workspace(current_user)
        workspace_id = workspace_info["workspace_id"]
        logger.info(f"Workspace ID: {workspace_id}")

        # Validate description
        if not description or len(description.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Document description is required"
            )

        # -----------------------------
        # Validate file
        # -----------------------------
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided"
            )

        file_extension = file.filename.split(".")[-1].lower()

        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Supported types: {', '.join(settings.ALLOWED_FILE_TYPES)}"
            )

        # -----------------------------
        # Read file
        # -----------------------------
        file_content = await file.read()

        file_size_mb = len(file_content) / (1024 * 1024)

        if file_size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
            )

        supabase = get_supabase_client()

        # -----------------------------
        # Generate file path (FIX: use original filename, not double extension)
        # -----------------------------
        document_id = str(uuid.uuid4())

        # Clean filename: replace spaces with underscores
        safe_filename = file.filename.replace(" ", "_")

        # Build file path (no double extension)
        file_path = f"{workspace_id}/{document_id}_{safe_filename}"

        # -----------------------------
        # Upload to Supabase Storage
        # -----------------------------
        try:
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Storage upload failed: {str(e)}"
            )

        # -----------------------------
        # Extract text
        # -----------------------------
        try:
            logger.info(f"Extracting text from {file_extension} file...")
            text_content = document_processor.extract_text(
                file_content,
                file_extension
            )
            logger.info(f"Extracted {len(text_content)} characters of text")

        except Exception as e:
            # cleanup uploaded file
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([file_path])

            raise HTTPException(
                status_code=400,
                detail=f"Text extraction failed: {str(e)}"
            )

        # -----------------------------
        # Save document metadata with description
        # -----------------------------
        document_data = {
            "id": document_id,
            "workspace_id": workspace_id,
            "name": file.filename,
            "description": description.strip(),  # NEW: Save description
            "file_path": file_path,
            "uploaded_by": current_user["id"]
        }

        doc_response = supabase.table("documents").insert(document_data).execute()

        if not doc_response.data:
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([file_path])

            raise HTTPException(
                status_code=500,
                detail="Failed to save document metadata"
            )

        document = doc_response.data[0]

        # -----------------------------
        # Process chunks in background (HUGE PERFORMANCE IMPROVEMENT)
        # -----------------------------
        background_tasks.add_task(
            process_document_chunks,
            document_id,
            workspace_id,
            text_content
        )

        logger.info(f"Document uploaded successfully, processing {len(text_content)} chars in background")

        return DocumentResponse(
            id=document["id"],
            workspace_id=document["workspace_id"],
            name=document["name"],
            description=document.get("description", ""),
            file_path=document["file_path"],
            uploaded_by=document["uploaded_by"],
            uploader_name=current_user["user_metadata"].get("full_name", current_user["email"]),
            created_at=document["created_at"],  # Supabase returns ISO string, Pydantic will parse it
            chunk_count=0
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Document upload error: {str(e)}", exc_info=True)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


# ================================
# Get Documents
# ================================
@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    workspace_id: str = Depends(get_workspace_id),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all documents in the current workspace"""
    try:

        # Use direct database query to get documents with uploader info
        from app.models.database import db
        pool = await db.get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    d.id, d.workspace_id, d.name, d.description, d.file_path, 
                    d.uploaded_by, d.created_at,
                    u.email as uploader_email,
                    u.raw_user_meta_data->>'full_name' as uploader_name,
                    (SELECT COUNT(*) FROM document_chunks WHERE document_id = d.id) as chunk_count
                FROM documents d
                JOIN auth.users u ON d.uploaded_by = u.id
                WHERE d.workspace_id = $1
                ORDER BY d.created_at DESC
                """,
                workspace_id
            )
            
            documents = []
            for row in rows:
                documents.append(
                    DocumentResponse(
                        id=str(row["id"]),
                        workspace_id=str(row["workspace_id"]),
                        name=row["name"],
                        description=row["description"] or "",
                        file_path=row["file_path"],
                        uploaded_by=str(row["uploaded_by"]),
                        uploader_name=row["uploader_name"] or row["uploader_email"],
                        created_at=row["created_at"].isoformat(),
                        chunk_count=row["chunk_count"]
                    )
                )
            
            return documents

    except Exception as e:
        logger.error(f"Get documents error: {str(e)}", exc_info=True)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to get documents: {str(e)}"
        )


# ================================
# Delete Document
# ================================
@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    try:

        workspace_info = await get_user_workspace(current_user)
        workspace_id = workspace_info["workspace_id"]

        supabase = get_supabase_client()

        doc_response = supabase.table("documents") \
            .select("*") \
            .eq("id", document_id) \
            .eq("workspace_id", workspace_id) \
            .execute()

        if not doc_response.data:

            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        doc = doc_response.data[0]

        # delete chunks
        supabase.table("document_chunks") \
            .delete() \
            .eq("document_id", document_id) \
            .execute()

        # delete document record
        supabase.table("documents") \
            .delete() \
            .eq("id", document_id) \
            .execute()

        # delete storage file
        try:

            supabase.storage \
                .from_(settings.SUPABASE_STORAGE_BUCKET) \
                .remove([doc["file_path"]])

        except Exception as e:
            logger.warning(f"Storage delete failed: {str(e)}")

        return MessageResponse(message="Document deleted successfully")

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Delete document error: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )