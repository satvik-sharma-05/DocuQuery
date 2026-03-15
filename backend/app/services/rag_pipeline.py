import cohere
from app.core.config import settings
from app.services.embedding_service import embedding_service
from app.models.database import db
from typing import List, Dict, Any, Tuple, Optional
import logging
import asyncio
import re

logger = logging.getLogger(__name__)

class EnhancedRAGPipeline:
    def __init__(self):
        self.client = cohere.Client(settings.COHERE_API_KEY)
        self.llm_model = settings.LLM_MODEL
        self.top_k = settings.TOP_K_RESULTS
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        
        # Dynamic thresholds based on query complexity
        self.similarity_threshold = 0.0  # More permissive threshold
        self.min_chunks_for_answer = 1
        self.max_context_length = 8000  # Maximum context length for LLM
    
    async def preprocess_query(self, query: str) -> str:
        """Preprocess and normalize the query"""
        # Just remove extra whitespace for now
        query = re.sub(r'\s+', ' ', query.strip())
        return query
    
    async def search_similar_chunks(
        self, 
        query_embedding: List[float], 
        workspace_id: str,
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar document chunks using vector similarity with dynamic filtering"""
        try:
            pool = await db.get_pool()
            
            # Use provided top_k or default
            search_limit = top_k or self.top_k
            
            # Validate embedding
            if not query_embedding or len(query_embedding) != self.embedding_dimension:
                raise ValueError(f"Invalid query embedding: expected {self.embedding_dimension} dimensions, got {len(query_embedding) if query_embedding else 0}")
            
            # Convert embedding to string format for pgvector
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # Enhanced query with document metadata
            # Using cosine distance operator (<->) and converting to similarity
            # Cosine distance range: [0, 2], so similarity = 1 - (distance / 2)
            query = """
                SELECT 
                    dc.id,
                    dc.content,
                    dc.document_id,
                    d.name as document_name,
                    d.description as document_description,
                    d.created_at as document_created_at,
                    d.uploaded_by as uploader_id,
                    dc.embedding <-> $1::vector as distance,
                    1 - ((dc.embedding <-> $1::vector) / 2) as similarity_score
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE d.workspace_id = $2
                    AND dc.embedding IS NOT NULL
                ORDER BY dc.embedding <-> $1::vector
                LIMIT $3
            """
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, embedding_str, workspace_id, search_limit)
                
                logger.info(f"Raw search returned {len(rows)} chunks for workspace {workspace_id}")
                
                if not rows:
                    logger.warning(f"No chunks found for workspace {workspace_id}")
                    return []
                
                chunks = []
                for row in rows:
                    similarity_score = float(row["similarity_score"])
                    distance = float(row["distance"])
                    
                    logger.info(f"Chunk: {row['document_name']} - Distance: {distance:.4f}, Similarity: {similarity_score:.4f}")
                    
                    # Only include chunks above similarity threshold
                    if similarity_score >= self.similarity_threshold:
                        chunks.append({
                            "id": str(row["id"]),
                            "content": row["content"],
                            "document_id": str(row["document_id"]),
                            "document_name": row["document_name"],
                            "document_description": row["document_description"],
                            "uploader_id": str(row["uploader_id"]) if row["uploader_id"] else None,
                            "document_created_at": row["document_created_at"],
                            "distance": distance,
                            "similarity_score": similarity_score
                        })
                
                logger.info(f"Found {len(chunks)} relevant chunks (similarity >= {self.similarity_threshold})")
                return chunks
        
        except Exception as e:
            logger.error(f"Error searching similar chunks: {str(e)}", exc_info=True)
            raise
    
    async def rank_and_filter_chunks(
        self, 
        chunks: List[Dict[str, Any]], 
        query: str
    ) -> List[Dict[str, Any]]:
        """Advanced ranking and filtering of chunks"""
        if not chunks:
            return chunks
        
        # Sort by similarity score (descending)
        chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Remove duplicate content
        seen_content = set()
        unique_chunks = []
        
        for chunk in chunks:
            # Create a normalized version for duplicate detection
            normalized_content = re.sub(r'\s+', ' ', chunk["content"].lower().strip())
            
            if normalized_content not in seen_content:
                seen_content.add(normalized_content)
                unique_chunks.append(chunk)
        
        # Limit context length
        total_length = 0
        filtered_chunks = []
        
        for chunk in unique_chunks:
            chunk_length = len(chunk["content"])
            if total_length + chunk_length <= self.max_context_length:
                filtered_chunks.append(chunk)
                total_length += chunk_length
            else:
                break
        
        logger.info(f"Filtered to {len(filtered_chunks)} chunks (total context: {total_length} chars)")
        return filtered_chunks
    
    async def generate_enhanced_prompt(
        self, 
        query: str, 
        context_chunks: List[Dict[str, Any]]
    ) -> str:
        """Generate an enhanced prompt with better context"""
        if not context_chunks:
            return query
        
        # Create rich context with metadata
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            context_part = f"""
Document {i}: {chunk['document_name']}
{f"Description: {chunk['document_description']}" if chunk.get('document_description') else ""}
Relevance: {chunk['similarity_score']:.2f}

Content:
{chunk['content']}
"""
            context_parts.append(context_part.strip())
        
        enhanced_prompt = f"""
Based on the following documents from the workspace, please answer the user's question accurately and comprehensively.

CONTEXT DOCUMENTS:
{chr(10).join(context_parts)}

USER QUESTION: {query}

Please provide a detailed answer based on the information in the documents above. If the information is not sufficient or not found, please say so clearly.
"""
        
        return enhanced_prompt.strip()
    
    async def generate_answer(
        self, 
        query: str, 
        context_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """Generate answer using Cohere Chat API with enhanced context"""
        try:
            if not context_chunks:
                return "I couldn't find any relevant information in your documents to answer this question.", []
            
            logger.info(f"Generating answer with {len(context_chunks)} context chunks")
            
            # Prepare documents for Cohere RAG
            documents = []
            for chunk in context_chunks:
                doc_title = chunk["document_name"]
                if chunk.get("document_description"):
                    doc_title += f" - {chunk['document_description']}"
                
                documents.append({
                    "title": doc_title,
                    "snippet": chunk["content"]
                })
            
            logger.info(f"Prepared {len(documents)} documents for Cohere")
            
            # Generate response using Cohere Chat API with documents
            loop = asyncio.get_event_loop()
            
            logger.info("Calling Cohere API...")
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat(
                    model=self.llm_model,
                    message=query,
                    documents=documents,
                    temperature=0.3,
                    max_tokens=1000,  # Reduced for faster response
                    prompt_truncation='AUTO'
                )
            )
            logger.info("Cohere API call completed")
            
            if not response:
                raise Exception("Failed to get response from Cohere API")
            
            answer = response.text.strip()
            logger.info(f"Generated answer with {len(answer)} characters")
            
            # Enhanced answer cleaning
            answer = self._clean_answer(answer)
            
            # Validate answer quality
            if len(answer) < 10:
                logger.warning("Answer too short, using fallback")
                answer = f"Based on the document '{context_chunks[0]['document_name']}', here's what I found:\n\n{context_chunks[0]['content'][:500]}..."
            elif answer.count('0') > len(answer) * 0.3:
                logger.warning("Answer seems corrupted, using fallback")
                answer = f"Based on the document '{context_chunks[0]['document_name']}', here's what I found:\n\n{context_chunks[0]['content'][:500]}..."
            
            # Prepare enhanced sources
            sources = [
                {
                    "document_id": chunk["document_id"],
                    "document_name": chunk["document_name"],
                    "document_description": chunk.get("document_description"),
                    "uploader_id": chunk.get("uploader_id"),
                    "content_preview": chunk["content"][:300] + "..." if len(chunk["content"]) > 300 else chunk["content"],
                    "relevance_score": chunk["similarity_score"],
                    "created_at": chunk.get("document_created_at")
                }
                for chunk in context_chunks
            ]
            
            logger.info(f"Returning answer with {len(sources)} sources")
            return answer, sources
            
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}", exc_info=True)
            # Provide fallback answer with raw content
            if context_chunks:
                fallback_answer = f"I found relevant information in '{context_chunks[0]['document_name']}' but encountered an issue generating a response. Here's the relevant content:\n\n{context_chunks[0]['content'][:500]}..."
                sources = [{
                    "document_id": context_chunks[0]["document_id"],
                    "document_name": context_chunks[0]["document_name"],
                    "content_preview": context_chunks[0]["content"][:300] + "...",
                    "relevance_score": context_chunks[0]["similarity_score"]
                }]
                return fallback_answer, sources
            raise
    
    def _clean_answer(self, answer: str) -> str:
        """Clean and format the answer"""
        # Remove duplicate "Sources:" sections
        if answer.count("Sources:") > 1:
            parts = answer.split("Sources:")
            answer = parts[0] + "Sources:" + parts[1]
        
        # Remove any trailing "Sources:" without content
        if answer.endswith("Sources:"):
            answer = answer[:-8].strip()
        
        # Clean up corrupted text patterns
        # Remove excessive repeated characters or patterns
        answer = re.sub(r'(.)\1{10,}', r'\1', answer)  # Remove 10+ repeated chars
        answer = re.sub(r'[0-9">:\[\]{}]{20,}', '', answer)  # Remove long sequences of special chars
        answer = re.sub(r'[-s-]{10,}', '', answer)  # Remove repeated dash patterns
        answer = re.sub(r'[co-]{10,}', '', answer)  # Remove repeated "co-" patterns
        
        # Clean up extra whitespace
        answer = re.sub(r'\n\s*\n\s*\n', '\n\n', answer)
        answer = re.sub(r' +', ' ', answer)
        
        # Remove lines that are mostly special characters
        lines = answer.split('\n')
        clean_lines = []
        for line in lines:
            # Keep line if it has reasonable text content
            text_chars = len(re.sub(r'[^a-zA-Z\s]', '', line))
            total_chars = len(line)
            if total_chars == 0 or (text_chars / max(total_chars, 1)) > 0.3:
                clean_lines.append(line)
        
        answer = '\n'.join(clean_lines).strip()
        
        return answer
    
    async def query(
        self, 
        query: str, 
        workspace_id: str,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """Complete enhanced RAG pipeline"""
        try:
            logger.info(f"RAG query started for workspace {workspace_id}: '{query}'")
            
            # Set dynamic thresholds if provided
            original_threshold = None
            if similarity_threshold is not None:
                original_threshold = self.similarity_threshold
                self.similarity_threshold = similarity_threshold
                logger.info(f"Using custom similarity threshold: {similarity_threshold}")
            
            # Preprocess query
            processed_query = await self.preprocess_query(query)
            logger.info(f"Processed query: '{processed_query}'")
            
            # Generate query embedding
            logger.info("Generating query embedding...")
            query_embedding = await embedding_service.generate_query_embedding(processed_query)
            logger.info(f"Generated query embedding with {len(query_embedding)} dimensions")
            
            # Search for similar chunks
            logger.info(f"Searching for similar chunks (top_k={top_k or self.top_k})...")
            similar_chunks = await self.search_similar_chunks(
                query_embedding, 
                workspace_id, 
                top_k
            )
            
            if not similar_chunks:
                logger.warning("No similar chunks found")
                return "I couldn't find any relevant information in your documents to answer this question. Please make sure your documents contain the information you're looking for.", []
            
            logger.info(f"Found {len(similar_chunks)} similar chunks")
            
            # Rank and filter chunks
            logger.info("Ranking and filtering chunks...")
            filtered_chunks = await self.rank_and_filter_chunks(similar_chunks, processed_query)
            
            if not filtered_chunks:
                logger.warning("No chunks passed filtering")
                return "I found some potentially relevant information, but it doesn't seem closely related to your question. Please try rephrasing your question or check if the relevant documents are uploaded.", []
            
            logger.info(f"Filtered to {len(filtered_chunks)} chunks")
            
            # Generate answer
            logger.info("Generating answer...")
            answer, sources = await self.generate_answer(processed_query, filtered_chunks)
            
            # Restore original threshold if it was changed
            if original_threshold is not None:
                self.similarity_threshold = original_threshold
            
            logger.info(f"RAG query completed successfully with {len(sources)} sources")
            return answer, sources
            
        except Exception as e:
            logger.error(f"Error in enhanced RAG pipeline: {str(e)}", exc_info=True)
            # Restore original threshold on error
            if similarity_threshold is not None and original_threshold is not None:
                self.similarity_threshold = original_threshold
            raise

# Global enhanced RAG pipeline instance
rag_pipeline = EnhancedRAGPipeline()