from openai import OpenAI
import logging
from app.core.config import settings
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
        self.model = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # Truncate if too long
            max_length = 8000  # OpenAI token limit
            if len(text) > max_length:
                text = text[:max_length]
                logger.warning(f"Text truncated to {max_length} characters")
            
            logger.info(f"🔵 OPENROUTER API CALL - Generating embedding for text of length {len(text)}")
            logger.info(f"🔵 Using model: {self.model}")
            
            # Generate embedding using OpenRouter
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            
            if not response.data or len(response.data) == 0:
                raise ValueError("No embeddings returned from OpenRouter")
            
            embedding = response.data[0].embedding
            logger.info(f"✅ OPENROUTER API SUCCESS - Generated embedding with {len(embedding)} dimensions")
            
            return embedding
            
        except Exception as e:
            logger.error(f"❌ OPENROUTER API ERROR - Error generating embedding: {str(e)}")
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
            
            logger.info(f"🔵 OPENROUTER API CALL - Generating embeddings for {len(valid_texts)} texts")
            logger.info(f"🔵 Using model: {self.model}")
            
            # Truncate texts if needed
            max_length = 8000
            truncated_texts = [
                t[:max_length] if len(t) > max_length else t 
                for t in valid_texts
            ]
            
            # Generate embeddings using OpenRouter
            response = self.client.embeddings.create(
                model=self.model,
                input=truncated_texts
            )
            
            if not response.data:
                raise ValueError("No embeddings returned from OpenRouter")
            
            embeddings = [item.embedding for item in response.data]
            logger.info(f"✅ OPENROUTER API SUCCESS - Generated {len(embeddings)} embeddings")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ OPENROUTER API ERROR - Error generating batch embeddings: {str(e)}")
            raise
    
    async def generate_query_embedding(self, text: str) -> List[float]:
        """Generate embedding for a query (same as document embedding)"""
        # For now, use the same method as document embedding
        # In the future, you could use a different input_type for queries
        return await self.generate_embedding(text)

# Global instance
embedding_service = EmbeddingService()

# Force rebuild marker - do not remove