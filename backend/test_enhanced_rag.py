#!/usr/bin/env python3
"""
Test the enhanced RAG pipeline with different thresholds
"""

import asyncio
from app.services.rag_pipeline import rag_pipeline

async def test_enhanced_rag():
    """Test enhanced RAG with different similarity thresholds"""
    
    workspace_id = "852e656d-22b6-42de-b57a-fcea44726b3d"  # Satvik's workspace
    
    queries = ["what is hacktrack?", "tell me about hacktrack"]
    thresholds = [0.3, 0.5, 0.7]
    
    for query in queries:
        print(f"\n🔍 Testing query: '{query}'")
        print("=" * 60)
        
        for threshold in thresholds:
            print(f"\n--- Similarity threshold: {threshold} ---")
            
            try:
                answer, sources = await rag_pipeline.query(
                    query, 
                    workspace_id, 
                    similarity_threshold=threshold
                )
                
                print(f"Answer: {answer[:200]}...")
                print(f"Sources found: {len(sources)}")
                
                if sources:
                    print("Top source relevance scores:")
                    for i, source in enumerate(sources[:3]):
                        print(f"  {i+1}. {source['relevance_score']:.3f} - {source['document_name']}")
                        
            except Exception as e:
                print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_enhanced_rag())