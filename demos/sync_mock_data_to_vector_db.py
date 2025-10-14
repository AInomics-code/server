#!/usr/bin/env python3
"""
Sync mock data from client_data database to vector database (main_db)
This script reads data from client_data and creates embeddings for the vector search tables.

Usage: python sync_mock_data_to_vector_db.py
"""
import psycopg2
import time
from utils import get_bedrock_client, get_embedding
from config import DB_CONFIG


def get_client_data_connection():
    """Get connection to client_data database"""
    try:
        client_db_config = DB_CONFIG.copy()
        client_db_config['database'] = 'client_data'
        conn = psycopg2.connect(**client_db_config)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to client_data database: {e}")
        return None


def get_main_db_connection():
    """Get connection to main database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to main database: {e}")
        return None


def clear_vector_tables(conn):
    """Clear existing data from vector tables"""
    try:
        cur = conn.cursor()
        print("⏳ Clearing existing vector tables...")
        
        cur.execute("TRUNCATE TABLE products CASCADE")
        cur.execute("TRUNCATE TABLE clients CASCADE")
        cur.execute("TRUNCATE TABLE locations CASCADE")
        
        conn.commit()
        cur.close()
        print("✅ Vector tables cleared")
        return True
    except Exception as e:
        print(f"❌ Error clearing tables: {e}")
        conn.rollback()
        return False


def sync_products(client_conn, main_conn, bedrock_client):
    """Sync products from client_data to main_db with embeddings"""
    try:
        print("\n" + "="*70)
        print("📦 Syncing Products")
        print("="*70)
        
        # Read from client_data
        client_cur = client_conn.cursor()
        client_cur.execute("""
            SELECT product_id, product_name, brand
            FROM products
            WHERE product_state = 'Active'
            ORDER BY product_id
        """)
        products = client_cur.fetchall()
        client_cur.close()
        
        print(f"⏳ Found {len(products)} active products to sync...")
        
        # Insert into main_db with embeddings
        main_cur = main_conn.cursor()
        synced = 0
        errors = 0
        
        for idx, (product_id, product_name, brand) in enumerate(products, 1):
            try:
                # Generate embeddings
                name_embedding = get_embedding(product_name, bedrock_client)
                brand_embedding = get_embedding(brand, bedrock_client)
                
                if not name_embedding or not brand_embedding:
                    print(f"  ⚠️  Skipping {product_id}: Failed to generate embeddings")
                    errors += 1
                    continue
                
                # Insert into main_db
                main_cur.execute("""
                    INSERT INTO products 
                    (product_id, product_name, vt_product_name, product_brand, vt_product_brand)
                    VALUES (%s, %s, %s::vector, %s, %s::vector)
                    ON CONFLICT (product_id) DO UPDATE SET
                        product_name = EXCLUDED.product_name,
                        vt_product_name = EXCLUDED.vt_product_name,
                        product_brand = EXCLUDED.product_brand,
                        vt_product_brand = EXCLUDED.vt_product_brand,
                        updated_at = CURRENT_TIMESTAMP
                """, (product_id, product_name, name_embedding, brand, brand_embedding))
                
                synced += 1
                
                # Progress indicator
                if idx % 10 == 0:
                    main_conn.commit()
                    print(f"  ⏳ Progress: {idx}/{len(products)} products ({synced} synced, {errors} errors)")
                
                # Rate limiting to avoid overwhelming Bedrock
                time.sleep(0.1)
                
            except Exception as e:
                print(f"  ❌ Error syncing product {product_id}: {e}")
                errors += 1
                continue
        
        main_conn.commit()
        main_cur.close()
        
        print(f"\n✅ Products synced: {synced} successful, {errors} errors")
        return synced
        
    except Exception as e:
        print(f"❌ Error syncing products: {e}")
        main_conn.rollback()
        return 0


def sync_clients(client_conn, main_conn, bedrock_client):
    """Sync clients from client_data to main_db with embeddings"""
    try:
        print("\n" + "="*70)
        print("👥 Syncing Clients")
        print("="*70)
        
        # Read from client_data
        client_cur = client_conn.cursor()
        client_cur.execute("""
            SELECT id, client_name, client_group
            FROM clients
            ORDER BY id
        """)
        clients = client_cur.fetchall()
        client_cur.close()
        
        print(f"⏳ Found {len(clients)} clients to sync...")
        
        # Insert into main_db with embeddings
        main_cur = main_conn.cursor()
        synced = 0
        errors = 0
        
        for idx, (client_id, client_name, client_group) in enumerate(clients, 1):
            try:
                # Generate embeddings
                name_embedding = get_embedding(client_name, bedrock_client)
                group_embedding = get_embedding(client_group, bedrock_client)
                
                if not name_embedding or not group_embedding:
                    print(f"  ⚠️  Skipping {client_id}: Failed to generate embeddings")
                    errors += 1
                    continue
                
                # Insert into main_db
                main_cur.execute("""
                    INSERT INTO clients 
                    (client_id, client_name, vt_client_name, client_group, vt_client_group)
                    VALUES (%s, %s, %s::vector, %s, %s::vector)
                    ON CONFLICT (client_id) DO UPDATE SET
                        client_name = EXCLUDED.client_name,
                        vt_client_name = EXCLUDED.vt_client_name,
                        client_group = EXCLUDED.client_group,
                        vt_client_group = EXCLUDED.vt_client_group,
                        updated_at = CURRENT_TIMESTAMP
                """, (client_id, client_name, name_embedding, client_group, group_embedding))
                
                synced += 1
                
                # Progress indicator
                if idx % 20 == 0:
                    main_conn.commit()
                    print(f"  ⏳ Progress: {idx}/{len(clients)} clients ({synced} synced, {errors} errors)")
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                print(f"  ❌ Error syncing client {client_id}: {e}")
                errors += 1
                continue
        
        main_conn.commit()
        main_cur.close()
        
        print(f"\n✅ Clients synced: {synced} successful, {errors} errors")
        return synced
        
    except Exception as e:
        print(f"❌ Error syncing clients: {e}")
        main_conn.rollback()
        return 0


def sync_locations(client_conn, main_conn, bedrock_client):
    """Sync locations from client_data to main_db with embeddings"""
    try:
        print("\n" + "="*70)
        print("📍 Syncing Locations")
        print("="*70)
        
        # Read from client_data
        client_cur = client_conn.cursor()
        client_cur.execute("""
            SELECT id, location_name
            FROM locations
            WHERE location_state = 'Active'
            ORDER BY id
        """)
        locations = client_cur.fetchall()
        client_cur.close()
        
        print(f"⏳ Found {len(locations)} active locations to sync...")
        
        # Insert into main_db with embeddings
        main_cur = main_conn.cursor()
        synced = 0
        errors = 0
        
        for idx, (location_id, location_name) in enumerate(locations, 1):
            try:
                # Generate embedding
                name_embedding = get_embedding(location_name, bedrock_client)
                
                if not name_embedding:
                    print(f"  ⚠️  Skipping {location_id}: Failed to generate embedding")
                    errors += 1
                    continue
                
                # Insert into main_db
                main_cur.execute("""
                    INSERT INTO locations 
                    (location_id, location_name, vt_location_name)
                    VALUES (%s, %s, %s::vector)
                    ON CONFLICT (location_id) DO UPDATE SET
                        location_name = EXCLUDED.location_name,
                        vt_location_name = EXCLUDED.vt_location_name,
                        updated_at = CURRENT_TIMESTAMP
                """, (location_id, location_name, name_embedding))
                
                synced += 1
                
                # Progress indicator
                if idx % 10 == 0:
                    main_conn.commit()
                    print(f"  ⏳ Progress: {idx}/{len(locations)} locations ({synced} synced, {errors} errors)")
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                print(f"  ❌ Error syncing location {location_id}: {e}")
                errors += 1
                continue
        
        main_conn.commit()
        main_cur.close()
        
        print(f"\n✅ Locations synced: {synced} successful, {errors} errors")
        return synced
        
    except Exception as e:
        print(f"❌ Error syncing locations: {e}")
        main_conn.rollback()
        return 0


def print_summary(main_conn):
    """Print summary of synced data"""
    try:
        cur = main_conn.cursor()
        print("\n" + "="*70)
        print("📊 SYNC SUMMARY")
        print("="*70)
        
        # Products count
        cur.execute("SELECT COUNT(*) FROM products")
        products_count = cur.fetchone()[0]
        print(f"  Products in vector DB:      {products_count:>10}")
        
        # Clients count
        cur.execute("SELECT COUNT(*) FROM clients")
        clients_count = cur.fetchone()[0]
        print(f"  Clients in vector DB:       {clients_count:>10}")
        
        # Locations count
        cur.execute("SELECT COUNT(*) FROM locations")
        locations_count = cur.fetchone()[0]
        print(f"  Locations in vector DB:     {locations_count:>10}")
        
        print("="*70)
        
        cur.close()
    except Exception as e:
        print(f"❌ Error generating summary: {e}")


def main():
    """Main function to orchestrate the sync"""
    print("\n🔄 Starting Mock Data Sync to Vector Database")
    print("="*70)
    
    # Initialize Bedrock client
    print("⏳ Initializing AWS Bedrock client...")
    bedrock_client = get_bedrock_client()
    print("✅ Bedrock client ready")
    
    # Connect to databases
    print("⏳ Connecting to databases...")
    client_conn = get_client_data_connection()
    if not client_conn:
        print("❌ Failed to connect to client_data database")
        return
    
    main_conn = get_main_db_connection()
    if not main_conn:
        print("❌ Failed to connect to main database")
        client_conn.close()
        return
    
    print("✅ Connected to both databases")
    
    try:
        # Clear existing vector tables (optional)
        clear_choice = input("\n⚠️  Clear existing vector tables? (y/N): ").strip().lower()
        if clear_choice == 'y':
            if not clear_vector_tables(main_conn):
                print("❌ Failed to clear tables")
                return
        
        start_time = time.time()
        
        # Sync each table
        products_synced = sync_products(client_conn, main_conn, bedrock_client)
        clients_synced = sync_clients(client_conn, main_conn, bedrock_client)
        locations_synced = sync_locations(client_conn, main_conn, bedrock_client)
        
        # Print summary
        print_summary(main_conn)
        
        elapsed_time = time.time() - start_time
        print(f"\n⏱️  Total sync time: {elapsed_time:.2f} seconds")
        print("✅ Sync completed successfully!")
        print("="*70 + "\n")
        
        # Show example queries
        print("💡 You can now test with:")
        print("  python search_products_by_name.py 'electronics'")
        print("  python search_clients_by_name.py 'restaurant'")
        print("  python search_locations.py 'warehouse'")
        print()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Sync interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client_conn.close()
        main_conn.close()
        print("🔌 Database connections closed")


if __name__ == "__main__":
    main()

