"""
Test RAG query directly to diagnose the issue
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_pipeline import rag_pipeline
from app.models.database import db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_rag_query():
    """Test RAG query with the actual workspace"""
    workspace_id = "852e656d-22b6-42de-b57a-fcea44726b3d"
    query = "what is The Bloch sphere"
    
    logger.info(f"Testing RAG query: '{query}'")
    logger.info(f"Workspace ID: {workspace_id}")
    
    try:
        # Initialize database pool
        await db.get_pool()
        
        # Run query
        answer, sources = await rag_pipeline.query(query, workspace_id)
        
        logger.info(f"\n{'='*80}")
        logger.info(f"ANSWER:")
        logger.info(f"{'='*80}")
        logger.info(answer)
        logger.info(f"\n{'='*80}")
        logger.info(f"SOURCES ({len(sources)}):")
        logger.info(f"{'='*80}")
        for i, source in enumerate(sources, 1):
            logger.info(f"\n{i}. {source['document_name']}")
            logger.info(f"   Relevance: {source['relevance_score']:.4f}")
            logger.info(f"   Preview: {source['content_preview'][:100]}...")
        
        return answer, sources
        
    except Exception as e:
        logger.error(f"Error testing RAG query: {str(e)}", exc_info=True)
        raise
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(test_rag_query())
