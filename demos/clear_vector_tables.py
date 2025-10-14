#!/usr/bin/env python3
"""
Clear all data from vector database tables
Usage: python clear_vector_tables.py
"""
import psycopg2
from config import DB_CONFIG


def clear_vector_tables():
    """Clear all vector tables"""
    try:
        print("\n⚠️  WARNING: This will delete all data from vector tables!")
        print("Tables to be cleared: products, clients, locations")
        
        confirm = input("\nAre you sure you want to continue? (yes/no): ").strip().lower()
        
        if confirm != 'yes':
            print("❌ Operation cancelled")
            return
        
        print("\n⏳ Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("⏳ Clearing vector tables...")
        
        # Get counts before clearing
        cur.execute("SELECT COUNT(*) FROM products")
        products_before = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM clients")
        clients_before = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM locations")
        locations_before = cur.fetchone()[0]
        
        print(f"\n📊 Current data:")
        print(f"  Products:  {products_before:>6} records")
        print(f"  Clients:   {clients_before:>6} records")
        print(f"  Locations: {locations_before:>6} records")
        
        # Clear tables
        print("\n⏳ Deleting data...")
        cur.execute("TRUNCATE TABLE products CASCADE")
        cur.execute("TRUNCATE TABLE clients CASCADE")
        cur.execute("TRUNCATE TABLE locations CASCADE")
        
        conn.commit()
        
        # Verify
        cur.execute("SELECT COUNT(*) FROM products")
        products_after = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM clients")
        clients_after = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM locations")
        locations_after = cur.fetchone()[0]
        
        print(f"\n✅ Tables cleared successfully!")
        print(f"\n📊 After clearing:")
        print(f"  Products:  {products_after:>6} records")
        print(f"  Clients:   {clients_after:>6} records")
        print(f"  Locations: {locations_after:>6} records")
        
        cur.close()
        conn.close()
        
        print("\n💡 You can now run: python sync_mock_data_to_vector_db.py")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
            conn.close()


if __name__ == "__main__":
    clear_vector_tables()

