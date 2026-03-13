#!/usr/bin/env python3
"""
Test specific queries that user mentioned
"""

import asyncio
from app.services.rag_pipeline import rag_pipeline

async def test_queries():
    """Test the specific queries user mentioned"""
    
    # Use the workspace ID from the debug output
    workspace_id = "852e656d-22b6-42de-b57a-fcea44726b3d"  # Satvik Sharma's Workspace
    
    queries = [
        "hacktrac",
        "hacktrack", 
        "what is hacktrack?",
        "tell me about hacktrack",
        "what projects has Satvik worked on?",
        "what is in the resume?"
    ]
    
    for query in queries:
        print(f"\n🔍 Query: '{query}'")
        print("-" * 50)
        
        try:
            answer, sources = await rag_pipeline.query(query, workspace_id)
            print(f"Answer: {answer}")
            print(f"Sources: {len(sources)}")
            
            if sources:
                print("Top source content:")
                print(f"  {sources[0]['content_preview']}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_queries())