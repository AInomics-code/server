#!/usr/bin/env python3
"""
Script to create tables in 'client_data' schema and populate with mock data
Usage: python populate_mock_data.py
"""
import psycopg2
from faker import Faker
import random
from datetime import datetime, timedelta
from config import DB_CONFIG

# Initialize Faker
fake = Faker(['es_ES', 'en_US'])
Faker.seed(42)
random.seed(42)

# Configuration for mock data generation
NUM_LOCATIONS = 50
NUM_PRODUCTS = 500
NUM_CLIENTS = 1000
NUM_INVENTORY_RECORDS = 2000
NUM_BACKORDERS = 200
NUM_SALES = 5000


def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None


def create_database(conn):
    """Create the client_data database"""
    try:
        # Set autocommit mode to create database
        conn.autocommit = True
        
        cur = conn.cursor()
        print("⏳ Checking if database 'client_data' exists...")
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'client_data'")
        exists = cur.fetchone()
        
        if exists:
            print("  ⚠️  Database already exists, dropping it...")
            # Terminate existing connections
            cur.execute("""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = 'client_data'
                AND pid <> pg_backend_pid()
            """)
            # Drop the database
            cur.execute("DROP DATABASE client_data")
            print("  ✓ Existing database dropped")
        
        print("⏳ Creating database 'client_data'...")
        cur.execute("CREATE DATABASE client_data")
        
        # Verify creation
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'client_data'")
        if cur.fetchone():
            print("✅ Database created successfully")
            cur.close()
            return True
        else:
            print("❌ Database creation verification failed")
            cur.close()
            return False
            
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_tables(conn):
    """Create all tables in client_data database"""
    try:
        cur = conn.cursor()
        print("⏳ Creating tables...")
        
        # Create locations table
        cur.execute("""
            CREATE TABLE locations (
                id VARCHAR(50) PRIMARY KEY,
                location_name VARCHAR(255) NOT NULL,
                location_type VARCHAR(50),
                location_state VARCHAR(50),
                location_country VARCHAR(100) DEFAULT 'Panama',
                location_city VARCHAR(100)
            )
        """)
        print("  ✓ Created table: locations")
        
        # Create products table
        cur.execute("""
            CREATE TABLE products (
                product_id VARCHAR(50) PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                product_state VARCHAR(50),
                cost DECIMAL(10, 2),
                brand VARCHAR(100),
                product_category VARCHAR(100),
                product_subcategory VARCHAR(100),
                product_presentation VARCHAR(100)
            )
        """)
        print("  ✓ Created table: products")
        
        # Create clients table
        cur.execute("""
            CREATE TABLE clients (
                id VARCHAR(50) PRIMARY KEY,
                client_group VARCHAR(100),
                country_code VARCHAR(10),
                state_code VARCHAR(50),
                city_code VARCHAR(100),
                client_name VARCHAR(255) NOT NULL
            )
        """)
        print("  ✓ Created table: clients")
        
        # Create inventory table
        cur.execute("""
            CREATE TABLE inventory (
                product_id VARCHAR(50) NOT NULL,
                location_id VARCHAR(50) NOT NULL,
                inventory_qty INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (product_id, location_id),
                FOREIGN KEY (product_id) REFERENCES products(product_id),
                FOREIGN KEY (location_id) REFERENCES locations(id)
            )
        """)
        print("  ✓ Created table: inventory")
        
        # Create backorders table
        cur.execute("""
            CREATE TABLE backorders (
                id VARCHAR(50) PRIMARY KEY,
                date DATE NOT NULL,
                customer_id VARCHAR(50) NOT NULL,
                product_id VARCHAR(50) NOT NULL,
                location_id VARCHAR(50) NOT NULL,
                backorder_qty INTEGER NOT NULL,
                backorder_value_usd DECIMAL(10, 2),
                cost DECIMAL(10, 2),
                FOREIGN KEY (customer_id) REFERENCES clients(id),
                FOREIGN KEY (product_id) REFERENCES products(product_id),
                FOREIGN KEY (location_id) REFERENCES locations(id)
            )
        """)
        print("  ✓ Created table: backorders")
        
        # Create sales table
        cur.execute("""
            CREATE TABLE sales (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                type VARCHAR(50) NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                cost DECIMAL(10, 2),
                client_id VARCHAR(50) NOT NULL,
                product_id VARCHAR(50) NOT NULL,
                gross_amount DECIMAL(12, 2),
                net_amount DECIMAL(12, 2),
                discount_amount DECIMAL(10, 2),
                FOREIGN KEY (client_id) REFERENCES clients(id),
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            )
        """)
        print("  ✓ Created table: sales")
        
        conn.commit()
        cur.close()
        print("✅ All tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        return False


def populate_locations(conn):
    """Populate locations table with mock data"""
    try:
        cur = conn.cursor()
        print(f"⏳ Populating locations table ({NUM_LOCATIONS} records)...")
        
        location_types = ['Almacén Seco', 'Centro de Distribución', 'Almacén Refrigerado', 'Centro de Acopio']
        states = ['Active', 'Inactive', 'Maintenance']
        cities = ['Panama City', 'Colón', 'David', 'Chitré', 'Santiago', 'Penonomé', 'La Chorrera', 'Arraiján']
        
        location_names = [
            'Bodega de Alimentos', 'Centro de Distribución Alimentaria', 'Almacén de Productos Secos',
            'Bodega Refrigerada', 'Centro de Acopio', 'Almacén Regional', 'Depósito de Granos',
            'Centro Logístico de Alimentos', 'Bodega Central', 'Almacén de Tortillería'
        ]
        
        for i in range(NUM_LOCATIONS):
            location_id = f"LOC-{i+1:04d}"
            location_name = f"{random.choice(location_names)} {random.choice(['Norte', 'Sur', 'Este', 'Oeste', 'Central', ''])}"
            location_type = random.choice(location_types)
            location_state = random.choice(states)
            location_city = random.choice(cities)
            
            cur.execute("""
                INSERT INTO locations 
                (id, location_name, location_type, location_state, location_country, location_city)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (location_id, location_name, location_type, location_state, 'Panama', location_city))
        
        conn.commit()
        cur.close()
        print(f"✅ Populated {NUM_LOCATIONS} locations")
        return True
    except Exception as e:
        print(f"❌ Error populating locations: {e}")
        conn.rollback()
        return False


def populate_products(conn):
    """Populate products table with mock data"""
    try:
        cur = conn.cursor()
        print(f"⏳ Populating products table ({NUM_PRODUCTS} records)...")
        
        # Food production categories and subcategories
        categories = {
            'Tortillas y Panificación': {
                'products': ['Tortilla de Maíz', 'Tortilla de Harina', 'Tostadas', 'Tortilla Integral', 'Tortilla de Nopal'],
                'presentations': ['Paquete 1kg', 'Paquete 500g', 'Paquete 250g', 'Caja 5kg', 'Bulto 10kg']
            },
            'Salsas y Condimentos': {
                'products': ['Salsa Roja', 'Salsa Verde', 'Salsa Picante', 'Salsa Habanera', 'Salsa de Chipotle', 
                           'Salsa Búfalo', 'Salsa BBQ', 'Mayonesa', 'Mostaza', 'Ketchup'],
                'presentations': ['Botella 500ml', 'Botella 1L', 'Frasco 250ml', 'Galón', 'Cubeta 5L']
            },
            'Granos y Legumbres': {
                'products': ['Frijol Negro', 'Frijol Pinto', 'Frijol Bayo', 'Lenteja', 'Garbanzo', 
                           'Arroz Blanco', 'Arroz Integral', 'Maíz Pozolero', 'Haba Seca'],
                'presentations': ['Bolsa 1kg', 'Bolsa 5kg', 'Costal 20kg', 'Costal 50kg', 'Paquete 500g']
            },
            'Harinas y Masas': {
                'products': ['Harina de Maíz', 'Harina de Trigo', 'Masa Preparada', 'Harina Integral', 
                           'Fécula de Maíz', 'Harina para Tortilla', 'Premezcla para Pan'],
                'presentations': ['Bolsa 1kg', 'Bolsa 5kg', 'Saco 25kg', 'Saco 50kg', 'Paquete 500g']
            },
            'Aceites y Grasas': {
                'products': ['Aceite Vegetal', 'Aceite de Canola', 'Aceite de Maíz', 'Aceite de Girasol', 
                           'Manteca Vegetal', 'Aceite de Oliva', 'Aceite en Spray'],
                'presentations': ['Botella 1L', 'Botella 500ml', 'Garrafa 5L', 'Cubeta 20L', 'Bidón 50L']
            },
            'Enlatados y Conservas': {
                'products': ['Frijoles Refritos', 'Chiles Jalapeños', 'Chiles Chipotles', 'Rajas de Chile', 
                           'Elote en Grano', 'Puré de Tomate', 'Pasta de Tomate', 'Vegetales Mixtos'],
                'presentations': ['Lata 400g', 'Lata 800g', 'Lata 3kg', 'Lata 1kg', 'Frasco 500g']
            },
            'Chiles y Especias': {
                'products': ['Chile en Polvo', 'Comino Molido', 'Orégano', 'Pimienta Negra', 'Ajo en Polvo', 
                           'Cebolla en Polvo', 'Paprika', 'Chile de Árbol', 'Chile Guajillo'],
                'presentations': ['Bolsa 100g', 'Bolsa 500g', 'Bote 1kg', 'Costal 5kg', 'Frasco 250g']
            },
            'Botanas y Snacks': {
                'products': ['Totopos Naturales', 'Totopos con Sal', 'Chicharrones', 'Cacahuates', 
                           'Pepitas', 'Mix de Botanas', 'Palomitas', 'Churros'],
                'presentations': ['Bolsa 150g', 'Bolsa 300g', 'Caja 1kg', 'Caja 5kg', 'Display 24 pzas']
            }
        }
        
        # Food production brands (realistic Mexican/Latin American style)
        brands = ['El Molino', 'La Abuela', 'Don Tomate', 'Tradición', 'Sabor Casero', 
                  'La Cocina', 'Rancho Grande', 'Del Campo', 'Tierra Fértil', 'Cosecha Fresca',
                  'La Hacienda', 'Productos del Valle', 'Agroalimentos', 'La Despensa', 'Sabor Auténtico']
        
        states = ['Active', 'Discontinued', 'Seasonal']
        
        for i in range(NUM_PRODUCTS):
            product_id = f"PRD-{i+1:06d}"
            category = random.choice(list(categories.keys()))
            product_base = random.choice(categories[category]['products'])
            presentation = random.choice(categories[category]['presentations'])
            brand = random.choice(brands)
            
            # Create more realistic product names
            product_name = f"{brand} {product_base} {presentation}"
            
            # Realistic pricing for food products
            cost = round(random.uniform(2.0, 150.0), 2)
            product_state = random.choice(states) if random.random() > 0.15 else 'Active'
            
            # Extract just the subcategory (the base product type)
            subcategory = product_base
            
            cur.execute("""
                INSERT INTO products 
                (product_id, product_name, product_state, cost, brand, 
                 product_category, product_subcategory, product_presentation)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (product_id, product_name, product_state, cost, brand, 
                  category, subcategory, presentation))
        
        conn.commit()
        cur.close()
        print(f"✅ Populated {NUM_PRODUCTS} products")
        return True
    except Exception as e:
        print(f"❌ Error populating products: {e}")
        conn.rollback()
        return False


def populate_clients(conn):
    """Populate clients table with mock data"""
    try:
        cur = conn.cursor()
        print(f"⏳ Populating clients table ({NUM_CLIENTS} records)...")
        
        # Client groups for food industry
        client_groups = ['Restaurantes', 'Hoteles y Hospedaje', 'Tiendas Mayoristas', 
                        'Supermercados', 'Tiendas Minoristas', 'Servicios de Catering',
                        'Instituciones', 'Distribuidores']
        
        countries = ['PA', 'CR', 'NI', 'GT', 'SV', 'HN']
        states = ['Active', 'Inactive', 'VIP', 'Regular']
        
        # Business types that would buy food products
        business_types = [
            ('Restaurante', ['El Rincón', 'La Cocina de', 'Sabores de', 'Comedor', 'Fonda', 'Marisquería', 'Asadero']),
            ('Taquería', ['Tacos', 'Taquitos', 'Antojitos', 'El Taco Loco', 'Tacos al Pastor', 'La Taquiza']),
            ('Cafetería', ['Café', 'Coffee Shop', 'Cafetería', 'Expresso Bar', 'Cafetal']),
            ('Hotel', ['Hotel', 'Inn', 'Hostal', 'Resort', 'Grand Hotel']),
            ('Comedor', ['Comedor', 'Fonda', 'Cocina Económica', 'Lonchería']),
            ('Supermercado', ['Super', 'Supermercado', 'Súper Ahorros', 'Mercado']),
            ('Tienda', ['Tienda', 'Abarrotes', 'Mini Super', 'Bodega']),
            ('Panadería', ['Panadería', 'Pan Caliente', 'La Espiga de Oro', 'Horno']),
            ('Tortillería', ['Tortillería', 'Tortillas Frescas', 'Molino']),
            ('Marisquería', ['Mariscos', 'Pescados y Mariscos', 'Del Mar']),
            ('Pizzería', ['Pizza', 'Pizzería', "Mama's Pizza"]),
            ('Pupusería', ['Pupusería', 'Pupusas', 'Rincón Salvadoreño']),
            ('Carnicería', ['Carnicería', 'Carnes', 'La Vaca Feliz']),
            ('Distribuidora', ['Distribuidora', 'Distribuciones', 'Comercializadora']),
        ]
        
        for i in range(NUM_CLIENTS):
            client_id = f"CLI-{i+1:06d}"
            client_group = random.choice(client_groups)
            country_code = random.choice(countries)
            state_code = random.choice(states)
            city_code = fake.city()
            
            # Generate more realistic business names for food industry
            business_type, name_variations = random.choice(business_types)
            name_base = random.choice(name_variations)
            
            # Create varied names
            if random.random() > 0.5:
                client_name = f"{business_type} {name_base}"
            else:
                client_name = f"{name_base} {fake.last_name()}"
            
            cur.execute("""
                INSERT INTO clients 
                (id, client_group, country_code, state_code, city_code, client_name)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (client_id, client_group, country_code, state_code, city_code, client_name))
        
        conn.commit()
        cur.close()
        print(f"✅ Populated {NUM_CLIENTS} clients")
        return True
    except Exception as e:
        print(f"❌ Error populating clients: {e}")
        conn.rollback()
        return False


def populate_inventory(conn):
    """Populate inventory table with mock data"""
    try:
        cur = conn.cursor()
        print(f"⏳ Populating inventory table ({NUM_INVENTORY_RECORDS} records)...")
        
        # Get all product and location IDs
        cur.execute("SELECT product_id FROM products")
        products = [row[0] for row in cur.fetchall()]
        
        cur.execute("SELECT id FROM locations")
        locations = [row[0] for row in cur.fetchall()]
        
        # Generate unique product-location combinations
        combinations = set()
        while len(combinations) < NUM_INVENTORY_RECORDS:
            product = random.choice(products)
            location = random.choice(locations)
            combinations.add((product, location))
        
        for product_id, location_id in combinations:
            inventory_qty = random.randint(0, 1000)
            
            cur.execute("""
                INSERT INTO inventory 
                (product_id, location_id, inventory_qty)
                VALUES (%s, %s, %s)
            """, (product_id, location_id, inventory_qty))
        
        conn.commit()
        cur.close()
        print(f"✅ Populated {NUM_INVENTORY_RECORDS} inventory records")
        return True
    except Exception as e:
        print(f"❌ Error populating inventory: {e}")
        conn.rollback()
        return False


def populate_backorders(conn):
    """Populate backorders table with mock data"""
    try:
        cur = conn.cursor()
        print(f"⏳ Populating backorders table ({NUM_BACKORDERS} records)...")
        
        # Get all client, product, and location IDs
        cur.execute("SELECT id FROM clients")
        clients = [row[0] for row in cur.fetchall()]
        
        cur.execute("SELECT product_id, cost FROM products")
        products = cur.fetchall()
        
        cur.execute("SELECT id FROM locations")
        locations = [row[0] for row in cur.fetchall()]
        
        start_date = datetime.now() - timedelta(days=180)
        
        for i in range(NUM_BACKORDERS):
            backorder_id = f"BO-{i+1:06d}"
            date = start_date + timedelta(days=random.randint(0, 180))
            customer_id = random.choice(clients)
            product_id, product_cost = random.choice(products)
            location_id = random.choice(locations)
            backorder_qty = random.randint(1, 100)
            cost = float(product_cost) if product_cost else random.uniform(10, 300)
            backorder_value_usd = round(backorder_qty * cost * 1.3, 2)  # Cost + markup
            
            cur.execute("""
                INSERT INTO backorders 
                (id, date, customer_id, product_id, location_id, backorder_qty, backorder_value_usd, cost)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (backorder_id, date, customer_id, product_id, location_id, 
                  backorder_qty, backorder_value_usd, cost))
        
        conn.commit()
        cur.close()
        print(f"✅ Populated {NUM_BACKORDERS} backorders")
        return True
    except Exception as e:
        print(f"❌ Error populating backorders: {e}")
        conn.rollback()
        return False


def populate_sales(conn):
    """Populate sales table with mock data"""
    try:
        cur = conn.cursor()
        print(f"⏳ Populating sales table ({NUM_SALES} records)...")
        
        # Get all client and product IDs
        cur.execute("SELECT id FROM clients")
        clients = [row[0] for row in cur.fetchall()]
        
        cur.execute("SELECT product_id, cost FROM products")
        products = cur.fetchall()
        
        transaction_types = ['FACTURA', 'NOTA DE CREDITO']
        start_date = datetime.now() - timedelta(days=365)
        
        for _ in range(NUM_SALES):
            date = start_date + timedelta(days=random.randint(0, 365))
            trans_type = random.choice(transaction_types) if random.random() > 0.1 else 'FACTURA'
            quantity = random.randint(1, 50)
            client_id = random.choice(clients)
            product_id, product_cost = random.choice(products)
            
            cost = float(product_cost) if product_cost else random.uniform(10, 300)
            unit_price = round(cost * random.uniform(1.2, 2.0), 2)  # Markup
            
            line_amount = quantity * unit_price
            discount = round(line_amount * random.uniform(0, 0.15), 2)
            
            # Calculate gross and net amounts based on transaction type
            if trans_type == 'FACTURA':
                gross_amount = round(line_amount - discount, 2)
                net_amount = gross_amount
            else:  # NOTA DE CREDITO
                gross_amount = 0
                net_amount = -round(line_amount - discount, 2)
            
            discount_amount = discount
            
            cur.execute("""
                INSERT INTO sales 
                (date, type, quantity, unit_price, cost, client_id, product_id, 
                 gross_amount, net_amount, discount_amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (date, trans_type, quantity, unit_price, cost, client_id, product_id,
                  gross_amount, net_amount, discount_amount))
        
        conn.commit()
        cur.close()
        print(f"✅ Populated {NUM_SALES} sales records")
        return True
    except Exception as e:
        print(f"❌ Error populating sales: {e}")
        conn.rollback()
        return False


def print_summary(conn):
    """Print summary statistics of populated data"""
    try:
        cur = conn.cursor()
        print("\n" + "="*70)
        print("📊 DATA POPULATION SUMMARY")
        print("="*70)
        
        tables = ['locations', 'products', 'clients', 'inventory', 'backorders', 'sales']
        
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"  {table.capitalize():<20} {count:>10} records")
        
        print("="*70)
        
        # Additional statistics for sales
        cur.execute("""
            SELECT 
                type,
                COUNT(*) as count,
                SUM(net_amount) as total_amount
            FROM sales
            GROUP BY type
        """)
        
        print("\n💰 Sales Statistics:")
        for row in cur.fetchall():
            trans_type, count, total = row
            print(f"  {trans_type:<20} {count:>8} transactions  ${total:>15,.2f}")
        
        cur.close()
        print()
    except Exception as e:
        print(f"❌ Error generating summary: {e}")


def main():
    """Main function to orchestrate the data population"""
    print("\n🚀 Starting Mock Data Population")
    print("="*70)
    
    # Connect to default database to create client_data database
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        # Create database
        if not create_database(conn):
            return
        
        # Close connection to default database
        conn.close()
        
        # Connect to the new client_data database
        print("⏳ Connecting to client_data database...")
        client_db_config = DB_CONFIG.copy()
        client_db_config['database'] = 'client_data'
        conn = psycopg2.connect(**client_db_config)
        print("✅ Connected to client_data database")
        
        # Create tables
        if not create_tables(conn):
            return
        
        # Populate tables in order (respecting foreign key constraints)
        if not populate_locations(conn):
            return
        
        if not populate_products(conn):
            return
        
        if not populate_clients(conn):
            return
        
        if not populate_inventory(conn):
            return
        
        if not populate_backorders(conn):
            return
        
        if not populate_sales(conn):
            return
        
        # Print summary
        print_summary(conn)
        
        print("✅ Mock data population completed successfully!")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

