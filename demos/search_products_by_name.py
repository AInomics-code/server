#!/usr/bin/env python3
"""
Search products by name using vector similarity
Usage: python search_products_by_name.py "leche deslactosada"
"""
import sys
from utils import get_bedrock_client, get_embedding, search_vector_similarity


def search_products_by_name(query_text, limit=1):
    """
    Search for products by name using vector similarity
    
    Args:
        query_text (str): Search query
        limit (int): Number of results to return
    """
    print(f"\n🔍 Searching products by name: '{query_text}'")
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
        table='products',
        vector_column='vt_product_name',
        id_column='product_id',
        name_column='product_name',
        additional_columns=['product_brand'],
        limit=limit
    )
    
    if not results:
        print("❌ No results found")
        return
    
    # Display results
    if len(results) == 1:
        print(f"\n✅ Best match:\n")
        product_id = results[0][0]
        product_name = results[0][1]
        product_brand = results[0][2]
        similarity = results[0][3]
        
        print(f"Product ID:   {product_id}")
        print(f"Product Name: {product_name}")
        print(f"Brand:        {product_brand}")
        print(f"Similarity:   {similarity:.4f}")
    else:
        print(f"\n✅ Found {len(results)} similar products:\n")
        print(f"{'Rank':<6} {'Product ID':<12} {'Product Name':<40} {'Brand':<20} {'Similarity':<10}")
        print("-" * 100)
        
        for idx, row in enumerate(results, 1):
            product_id = row[0]
            product_name = row[1]
            product_brand = row[2]
            similarity = row[3]
            
            print(f"{idx:<6} {product_id:<12} {product_name:<40} {product_brand:<20} {similarity:.4f}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python search_products_by_name.py 'search query'")
        print("\nExamples:")
        print("  python search_products_by_name.py 'leche'")
        print("  python search_products_by_name.py 'pan integral'")
        print("  python search_products_by_name.py 'productos lácteos'")
        sys.exit(1)
    
    query = ' '.join(sys.argv[1:])
    search_products_by_name(query)


if __name__ == "__main__":
    main()

