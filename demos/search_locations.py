#!/usr/bin/env python3
"""
Search locations by name using vector similarity
Usage: python search_locations.py "ciudad de mexico"
"""
import sys
from utils import get_bedrock_client, get_embedding, search_vector_similarity


def search_locations(query_text, limit=1):
    """
    Search for locations by name using vector similarity
    
    Args:
        query_text (str): Search query
        limit (int): Number of results to return
    """
    print(f"\n🔍 Searching locations: '{query_text}'")
    print("=" * 70)
    
    # Get embedding for query
    print("⏳ Generating embedding...")
    bedrock_client = get_bedrock_client()
    query_embedding = get_embedding(query_text, bedrock_client)
    
    if not query_embedding:
        print("❌ Failed to generate embedding")
        return
    
    print("✓ Embedding generated successfully")
    
    # Search in database
    print("⏳ Searching in database...")
    results = search_vector_similarity(
        query_embedding=query_embedding,
        table='locations',
        vector_column='vt_location_name',
        id_column='location_id',
        name_column='location_name',
        limit=limit
    )
    
    if not results:
        print("❌ No results found")
        return
    
    # Display results
    if len(results) == 1:
        print(f"\n✅ Best match:\n")
        location_id = results[0][0]
        location_name = results[0][1]
        similarity = results[0][2]
        
        print(f"Location ID:   {location_id}")
        print(f"Location Name: {location_name}")
        print(f"Similarity:    {similarity:.4f}")
    else:
        print(f"\n✅ Found {len(results)} similar locations:\n")
        print(f"{'Rank':<6} {'Location ID':<15} {'Location Name':<50} {'Similarity':<10}")
        print("-" * 85)
        
        for idx, row in enumerate(results, 1):
            location_id = row[0]
            location_name = row[1]
            similarity = row[2]
            
            print(f"{idx:<6} {location_id:<15} {location_name:<50} {similarity:.4f}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python search_locations.py 'search query'")
        print("\nExamples:")
        print("  python search_locations.py 'guadalajara'")
        print("  python search_locations.py 'ciudad de mexico'")
        print("  python search_locations.py 'zona industrial'")
        sys.exit(1)
    
    query = ' '.join(sys.argv[1:])
    search_locations(query)


if __name__ == "__main__":
    main()

