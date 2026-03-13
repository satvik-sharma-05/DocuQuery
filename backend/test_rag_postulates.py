import asyncio
from app.services.rag_pipeline import rag_pipeline

async def test():
    # Correct workspace ID for Rohan's Workspace
    workspace_id = '6af2ef13-44fb-47a8-8a2f-04fcff3e7b30'
    
    print("Testing RAG with query: 'what are postulates?'")
    print(f"Workspace ID: {workspace_id}\n")
    
    answer, sources = await rag_pipeline.query('what are postulates?', workspace_id)
    
    print('='*60)
    print('ANSWER:')
    print('='*60)
    print(answer)
    print('\n' + '='*60)
    print(f'SOURCES COUNT: {len(sources)}')
    print('='*60)
    
    for i, source in enumerate(sources, 1):
        print(f"\n{i}. {source['document_name']}")
        print(f"   Relevance: {source['relevance_score']:.4f}")
        print(f"   Preview: {source['content_preview'][:100]}...")

asyncio.run(test())
