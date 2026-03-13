import asyncio
from app.services.rag_pipeline import rag_pipeline

async def test_hacktrack_correct_workspace():
    try:
        # Test with the workspace that actually has HackTrack content
        query = 'what is hacktrack?'
        workspace_id = '3fc94c5c-e569-4d2b-84d2-f04ed4157595'  # Workspace with resume_3.pdf.pdf
        
        print(f'Testing query: "{query}"')
        print(f'Workspace ID: {workspace_id}')
        
        answer, sources = await rag_pipeline.query(query, workspace_id)
        
        print(f'\nAnswer: {answer}')
        print(f'\nSources found: {len(sources)}')
        for i, source in enumerate(sources):
            print(f'Source {i+1}: {source["document_name"]} (relevance: {source.get("relevance_score", "N/A")})')
            print(f'  Preview: {source.get("content_preview", "")[:100]}...')
            
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_hacktrack_correct_workspace())