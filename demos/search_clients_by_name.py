#!/usr/bin/env python3
"""
Search clients by name using vector similarity
Usage: python search_clients_by_name.py "restaurante"
"""
import sys
from utils import get_bedrock_client, get_embedding, search_vector_similarity


def search_clients_by_name(query_text, limit=1):
    """
    Search for clients by name using vector similarity
    
    Args:
        query_text (str): Search query
        limit (int): Number of results to return
    """
    print(f"\n🔍 Searching clients by name: '{query_text}'")
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
        table='clients',
        vector_column='vt_client_name',
        id_column='client_id',
        name_column='client_name',
        additional_columns=['client_group'],
        limit=limit
    )
    
    if not results:
        print("❌ No results found")
        return
    
    # Display results
    if len(results) == 1:
        print(f"\n✅ Best match:\n")
        client_id = results[0][0]
        client_name = results[0][1]
        client_group = results[0][2]
        similarity = results[0][3]
        
        print(f"Client ID:    {client_id}")
        print(f"Client Name:  {client_name}")
        print(f"Group:        {client_group}")
        print(f"Similarity:   {similarity:.4f}")
    else:
        print(f"\n✅ Found {len(results)} similar clients:\n")
        print(f"{'Rank':<6} {'Client ID':<12} {'Client Name':<50} {'Group':<25} {'Similarity':<10}")
        print("-" * 110)
        
        for idx, row in enumerate(results, 1):
            client_id = row[0]
            client_name = row[1]
            client_group = row[2]
            similarity = row[3]
            
            print(f"{idx:<6} {client_id:<12} {client_name:<50} {client_group:<25} {similarity:.4f}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python search_clients_by_name.py 'search query'")
        print("\nExamples:")
        print("  python search_clients_by_name.py 'restaurante'")
        print("  python search_clients_by_name.py 'hotel'")
        print("  python search_clients_by_name.py 'cafetería'")
        sys.exit(1)
    
    query = ' '.join(sys.argv[1:])
    search_clients_by_name(query)


if __name__ == "__main__":
    main()

