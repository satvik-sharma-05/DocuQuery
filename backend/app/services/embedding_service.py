import cohere
from app.core.config import settings
from typing import List
import asyncio
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.client = cohere.Client(settings.COHERE_API_KEY)
        self.model = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            # Validate input
            if not text or len(text.strip()) < 1:
                raise ValueError("Text cannot be empty")
            
            # Truncate if too long (Cohere has a limit)
            max_length = 512 * 4  # Approximate token limit
            if len(text) > max_length:
                logger.warning(f"Text too long ({len(text)} chars), truncating to {max_length}")
                text = text[:max_length]
            
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                lambda: self.client.embed(
                    texts=[text],
                    model=self.model,
                    input_type="search_document"
                )
            )
            
            if not result.embeddings or len(result.embeddings) == 0:
                raise ValueError("No embeddings returned from Cohere")
            
            embedding = result.embeddings[0]
            
            # Validate embedding dimension
            if len(embedding) != self.dimension:
                raise ValueError(f"Expected {self.dimension} dimensions, got {len(embedding)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}", exc_info=True)
            raise
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a query"""
        try:
            # Validate input
            if not query or len(query.strip()) < 1:
                raise ValueError("Query cannot be empty")
            
            # Truncate if too long
            max_length = 512 * 4
            if len(query) > max_length:
                logger.warning(f"Query too long ({len(query)} chars), truncating to {max_length}")
                query = query[:max_length]
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.embed(
                    texts=[query],
                    model=self.model,
                    input_type="search_query"
                )
            )
            
            if not result.embeddings or len(result.embeddings) == 0:
                raise ValueError("No embeddings returned from Cohere")
            
            embedding = result.embeddings[0]
            
            # Validate embedding dimension
            if len(embedding) != self.dimension:
                raise ValueError(f"Expected {self.dimension} dimensions, got {len(embedding)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating query embedding: {str(e)}", exc_info=True)
            raise
    
    async def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            # Cohere supports batch processing
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.embed(
                    texts=texts,
                    model=self.model,
                    input_type="search_document"
                )
            )
            return result.embeddings
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            # Fallback to individual processing
            embeddings = []
            for text in texts:
                embedding = await self.generate_embedding(text)
                embeddings.append(embedding)
            return embeddings

# Global embedding service instance
embedding_service = EmbeddingService()