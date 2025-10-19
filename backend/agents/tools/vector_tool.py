from langchain_core.tools import tool
from typing import Dict, Any, List

def create_vector_tool(queries_executed_ref: List[Dict]) -> tool:
    """
    Creates a vector search tool for LangGraph agent
    
    Args:
        queries_executed_ref: Reference to list where executed queries are logged
        
    Returns:
        LangChain tool function
    """
    
    @tool
    async def vector_search(search_query: str, category: str = "products") -> Dict[str, Any]:
        """Semantic search to find product_id, client_id, or location_id by name or description.
        
        Use this tool BEFORE querying the database when you need to identify a specific 
        product/client/location from natural language.
        
        The vector search will return the ID that can be used in SQL WHERE clauses.
        
        Args:
            search_query: Natural language search term (e.g., 'tortillas de nopal', 'cliente mayorista')
            category: What type of entity to search for. Options: 'products', 'clients', 'locations'
            
        Returns:
            Dict with success status and list of matching entities with their IDs and similarity scores
        """
        from tools.vector_search import VectorSearchTool
        
        print(f"\n{'─'*60}")
        print(f"[TOOL: vector_search]")
        print(f"Query: {search_query}")
        print(f"Category: {category}")
        print(f"{'─'*60}")
        
        vector_tool = VectorSearchTool()
        result = await vector_tool.execute(search_query, category=category)
        
        # Log the search
        queries_executed_ref.append({
            "type": "vector_search",
            "database": "main_db",
            "target": category,
            "search_term": search_query,
            "source": "dynamic_agent",
            "success": result.get('success', False),
            "results_found": len(result.get('data', []))
        })
        
        if result.get('error'):
            print(f"❌ Vector Search Error: {result['error']}\n")
            return {
                "success": False,
                "error": result['error'],
                "message": "Vector search failed"
            }
        else:
            results_count = len(result.get('data', []))
            print(f"✅ Vector Search Success: {results_count} results found\n")
            return result
    
    return vector_search

