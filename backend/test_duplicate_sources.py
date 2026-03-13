import asyncio
from app.services.rag_pipeline import rag_pipeline

async def test():
    # Test with Marketing workspace (has resume)
    workspace_id = '3fc94c5c-e569-4d2b-84d2-f04ed4157595'
    
    queries = [
        'what is hacktrack?',
        'tell me about the person in the resume',
        'what are the skills mentioned?'
    ]
    
    for query in queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print('='*60)
        
        answer, sources = await rag_pipeline.query(query, workspace_id)
        
        print(f"\nAnswer:\n{answer}")
        print(f"\nSources count: {len(sources)}")
        
        # Check for duplicate "Sources:" in answer
        sources_count = answer.count("Sources:")
        if sources_count > 1:
            print(f"\n⚠️  WARNING: Found {sources_count} 'Sources:' sections in answer!")
        elif sources_count == 1:
            print(f"\n✅ Single 'Sources:' section found")
        else:
            print(f"\n✅ No 'Sources:' section in answer")

asyncio.run(test())
