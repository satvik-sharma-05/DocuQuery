import cohere
import logging
from app.core.config import settings
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.client = cohere.Client(settings.COHERE_API_KEY)
        self.model = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # Truncate if too long
            max_length = 8000
            if len(text) > max_length:
                text = text[:max_length]
                logger.warning(f"Text truncated to {max_length} characters")
            
            logger.info(f"🔵 COHERE API CALL - Generating embedding for text of length {len(text)}")
            logger.info(f"🔵 Using model: {self.model}")
            
            # Generate embedding using Cohere
            response = self.client.embed(
                texts=[text],
                model=self.model,
                input_type="search_document"
            )
            
            if not response.embeddings or len(response.embeddings) == 0:
                raise ValueError("No embeddings returned from Cohere")
            
            embedding = response.embeddings[0]
            logger.info(f"✅ COHERE API SUCCESS - Generated embedding with {len(embedding)} dimensions")
            
            return embedding
            
        except Exception as e:
            logger.error(f"❌ COHERE API ERROR - Error generating embedding: {str(e)}")
            raise
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            if not texts:
                raise ValueError("Texts list cannot be empty")
            
            # Filter out empty texts
            valid_texts = [t for t in texts if t and t.strip()]
            if not valid_texts:
                raise ValueError("No valid texts to embed")
            
            logger.info(f"🔵 COHERE API CALL - Generating embeddings for {len(valid_texts)} texts")
            logger.info(f"🔵 Using model: {self.model}")
            
            # Truncate texts if needed
            max_length = 8000
            truncated_texts = [
                t[:max_length] if len(t) > max_length else t 
                for t in valid_texts
            ]
            
            # Generate embeddings using Cohere
            response = self.client.embed(
                texts=truncated_texts,
                model=self.model,
                input_type="search_document"
            )
            
            if not response.embeddings:
                raise ValueError("No embeddings returned from Cohere")
            
            embeddings = response.embeddings
            logger.info(f"✅ COHERE API SUCCESS - Generated {len(embeddings)} embeddings")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ COHERE API ERROR - Error generating batch embeddings: {str(e)}")
            raise
    
    async def generate_query_embedding(self, text: str) -> List[float]:
        """Generate embedding for a query"""
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # Truncate if too long
            max_length = 8000
            if len(text) > max_length:
                text = text[:max_length]
            
            logger.info(f"🔵 COHERE API CALL - Generating query embedding")
            
            # Use search_query input type for queries
            response = self.client.embed(
                texts=[text],
                model=self.model,
                input_type="search_query"
            )
            
            if not response.embeddings or len(response.embeddings) == 0:
                raise ValueError("No embeddings returned from Cohere")
            
            embedding = response.embeddings[0]
            logger.info(f"✅ COHERE API SUCCESS - Generated query embedding with {len(embedding)} dimensions")
            
            return embedding
            
        except Exception as e:
            logger.error(f"❌ COHERE API ERROR - Error generating query embedding: {str(e)}")
            raise

# Global instance
embedding_service = EmbeddingService()

# Force rebuild marker - do not remove