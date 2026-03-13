import asyncio
from app.services.rag_pipeline import rag_pipeline

async def test_hacktrack():
    try:
        # Test with the exact query that was failing
        query = 'what is hacktrack?'
        workspace_id = '550e8400-e29b-41d4-a716-446655440000'  # Satvik's workspace
        
        print(f'Testing query: "{query}"')
        print(f'Workspace ID: {workspace_id}')
        
        answer, sources = await rag_pipeline.query(query, workspace_id)
        
        print(f'\nAnswer: {answer}')
        print(f'\nSources found: {len(sources)}')
        for i, source in enumerate(sources):
            print(f'Source {i+1}: {source["document_name"]} (relevance: {source.get("relevance_score", "N/A")})')
            
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_hacktrack())