import os
import json
import time
import boto3
import psycopg2
from psycopg2.extras import execute_values
from botocore.exceptions import ClientError

# Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'postgres'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'main_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres123')
}

AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
BEDROCK_MODEL_ID = 'amazon.titan-embed-text-v1'

# Mock data - Food products
MOCK_PRODUCTS = [
    # Lácteos
    {'product_id': 'PROD-001', 'product_name': 'Leche Entera Lala 1L', 'product_brand': 'Lala'},
    {'product_id': 'PROD-002', 'product_name': 'Leche Deslactosada Alpura 1L', 'product_brand': 'Alpura'},
    {'product_id': 'PROD-003', 'product_name': 'Yogurt Natural Danone 1kg', 'product_brand': 'Danone'},
    {'product_id': 'PROD-004', 'product_name': 'Yogurt Griego Fage 500g', 'product_brand': 'Fage'},
    {'product_id': 'PROD-005', 'product_name': 'Queso Manchego Alpura 400g', 'product_brand': 'Alpura'},
    {'product_id': 'PROD-006', 'product_name': 'Queso Oaxaca La Villita 400g', 'product_brand': 'La Villita'},
    {'product_id': 'PROD-007', 'product_name': 'Mantequilla Gloria 200g', 'product_brand': 'Gloria'},
    {'product_id': 'PROD-008', 'product_name': 'Crema Lala 500ml', 'product_brand': 'Lala'},
    
    # Panadería
    {'product_id': 'PROD-009', 'product_name': 'Pan Blanco Bimbo Grande', 'product_brand': 'Bimbo'},
    {'product_id': 'PROD-010', 'product_name': 'Pan Integral Oroweat 680g', 'product_brand': 'Oroweat'},
    {'product_id': 'PROD-011', 'product_name': 'Pan Dulce Marinela Gansito', 'product_brand': 'Marinela'},
    {'product_id': 'PROD-012', 'product_name': 'Tortillas de Maíz Maseca 1kg', 'product_brand': 'Maseca'},
    {'product_id': 'PROD-013', 'product_name': 'Tortillas de Harina Mission 500g', 'product_brand': 'Mission'},
    {'product_id': 'PROD-014', 'product_name': 'Bolillo Artesanal La Espiga', 'product_brand': 'La Espiga'},
    
    # Carnes y Embutidos
    {'product_id': 'PROD-015', 'product_name': 'Jamón de Pavo FUD 500g', 'product_brand': 'FUD'},
    {'product_id': 'PROD-016', 'product_name': 'Salchicha Vienna FUD 8pz', 'product_brand': 'FUD'},
    {'product_id': 'PROD-017', 'product_name': 'Chorizo Argentino San Rafael 400g', 'product_brand': 'San Rafael'},
    {'product_id': 'PROD-018', 'product_name': 'Carne Molida Res Premium 1kg', 'product_brand': 'Sukarne'},
    {'product_id': 'PROD-019', 'product_name': 'Pechuga de Pollo Sin Hueso 1kg', 'product_brand': 'Pilgrim'},
    {'product_id': 'PROD-020', 'product_name': 'Tocino Ahumado Oscar Mayer 200g', 'product_brand': 'Oscar Mayer'},
    
    # Frutas y Verduras
    {'product_id': 'PROD-021', 'product_name': 'Manzana Red Delicious 1kg', 'product_brand': 'Del Monte'},
    {'product_id': 'PROD-022', 'product_name': 'Plátano Dominico 1kg', 'product_brand': 'Fresh'},
    {'product_id': 'PROD-023', 'product_name': 'Naranja Valencia 2kg', 'product_brand': 'Citrofrut'},
    {'product_id': 'PROD-024', 'product_name': 'Aguacate Hass 1kg', 'product_brand': 'Don Aguacato'},
    {'product_id': 'PROD-025', 'product_name': 'Jitomate Bola 1kg', 'product_brand': 'Fresh'},
    {'product_id': 'PROD-026', 'product_name': 'Lechuga Romana Fresca', 'product_brand': 'Verde Valle'},
    {'product_id': 'PROD-027', 'product_name': 'Zanahoria Natural 1kg', 'product_brand': 'Fresh'},
    {'product_id': 'PROD-028', 'product_name': 'Papa Blanca 2kg', 'product_brand': 'Fresh'},
    
    # Despensa
    {'product_id': 'PROD-029', 'product_name': 'Arroz Blanco Verde Valle 1kg', 'product_brand': 'Verde Valle'},
    {'product_id': 'PROD-030', 'product_name': 'Frijol Negro La Costeña 1kg', 'product_brand': 'La Costeña'},
    {'product_id': 'PROD-031', 'product_name': 'Pasta Espagueti Barilla 500g', 'product_brand': 'Barilla'},
    {'product_id': 'PROD-032', 'product_name': 'Aceite de Oliva Carbonell 500ml', 'product_brand': 'Carbonell'},
    {'product_id': 'PROD-033', 'product_name': 'Aceite Vegetal 123 1L', 'product_brand': '123'},
    {'product_id': 'PROD-034', 'product_name': 'Sal La Fina 1kg', 'product_brand': 'La Fina'},
    {'product_id': 'PROD-035', 'product_name': 'Azúcar Refinada Zulka 1kg', 'product_brand': 'Zulka'},
    {'product_id': 'PROD-036', 'product_name': 'Harina de Trigo Gold Medal 1kg', 'product_brand': 'Gold Medal'},
    {'product_id': 'PROD-037', 'product_name': 'Avena Quaker Hojuelas 800g', 'product_brand': 'Quaker'},
    
    # Enlatados y Conservas
    {'product_id': 'PROD-038', 'product_name': 'Atún en Agua Tuny 140g', 'product_brand': 'Tuny'},
    {'product_id': 'PROD-039', 'product_name': 'Chiles Jalapeños La Costeña 380g', 'product_brand': 'La Costeña'},
    {'product_id': 'PROD-040', 'product_name': 'Frijoles Refritos Isadora 430g', 'product_brand': 'Isadora'},
    {'product_id': 'PROD-041', 'product_name': 'Puré de Tomate Del Monte 210g', 'product_brand': 'Del Monte'},
    {'product_id': 'PROD-042', 'product_name': 'Maíz Elote Entero Herdez 410g', 'product_brand': 'Herdez'},
    {'product_id': 'PROD-043', 'product_name': 'Sardinas en Tomate Dolores 425g', 'product_brand': 'Dolores'},
    
    # Bebidas
    {'product_id': 'PROD-044', 'product_name': 'Coca Cola 2L', 'product_brand': 'Coca Cola'},
    {'product_id': 'PROD-045', 'product_name': 'Pepsi 2L', 'product_brand': 'Pepsi'},
    {'product_id': 'PROD-046', 'product_name': 'Jugo de Naranja Del Valle 1L', 'product_brand': 'Del Valle'},
    {'product_id': 'PROD-047', 'product_name': 'Agua Mineral Topo Chico 1L', 'product_brand': 'Topo Chico'},
    {'product_id': 'PROD-048', 'product_name': 'Cerveza Corona Extra 355ml', 'product_brand': 'Corona'},
    {'product_id': 'PROD-049', 'product_name': 'Café Soluble Nescafé 200g', 'product_brand': 'Nescafé'},
    {'product_id': 'PROD-050', 'product_name': 'Té Negro Lipton 100 sobres', 'product_brand': 'Lipton'},
    
    # Snacks y Botanas
    {'product_id': 'PROD-051', 'product_name': 'Papas Sabritas Original 170g', 'product_brand': 'Sabritas'},
    {'product_id': 'PROD-052', 'product_name': 'Doritos Nacho 300g', 'product_brand': 'Doritos'},
    {'product_id': 'PROD-053', 'product_name': 'Palomitas Act II Mantequilla 240g', 'product_brand': 'Act II'},
    {'product_id': 'PROD-054', 'product_name': 'Cacahuates Japoneses Nishikawa 280g', 'product_brand': 'Nishikawa'},
    {'product_id': 'PROD-055', 'product_name': 'Galletas Marías Gamesa 450g', 'product_brand': 'Gamesa'},
    {'product_id': 'PROD-056', 'product_name': 'Galletas Oreo 432g', 'product_brand': 'Oreo'},
    {'product_id': 'PROD-057', 'product_name': 'Chocolate Carlos V 18.5g', 'product_brand': 'Nestlé'},
    {'product_id': 'PROD-058', 'product_name': 'Chicles Trident 24g', 'product_brand': 'Trident'},
    
    # Congelados
    {'product_id': 'PROD-059', 'product_name': 'Pizza Congelada Dominos 400g', 'product_brand': 'Dominos'},
    {'product_id': 'PROD-060', 'product_name': 'Helado Holanda Vainilla 1L', 'product_brand': 'Holanda'},
    {'product_id': 'PROD-061', 'product_name': 'Verduras Mixtas Congeladas 1kg', 'product_brand': 'Del Monte'},
    {'product_id': 'PROD-062', 'product_name': 'Nuggets de Pollo Tyson 800g', 'product_brand': 'Tyson'},
    {'product_id': 'PROD-063', 'product_name': 'Camarones Congelados 500g', 'product_brand': 'Ocean Garden'},
]

MOCK_CLIENTS = [
    # Restaurantes
    {'client_id': 'CLI-001', 'client_name': 'Restaurante La Tradición', 'client_group': 'Restaurante'},
    {'client_id': 'CLI-002', 'client_name': 'Taquería El Buen Sabor', 'client_group': 'Restaurante'},
    {'client_id': 'CLI-003', 'client_name': 'Restaurant Los Arcos Mariscos', 'client_group': 'Restaurante'},
    {'client_id': 'CLI-004', 'client_name': 'Pizzería Napolitana', 'client_group': 'Restaurante'},
    {'client_id': 'CLI-005', 'client_name': 'Restaurante Las Delicias', 'client_group': 'Restaurante'},
    
    # Cafeterías
    {'client_id': 'CLI-006', 'client_name': 'Café El Bohemio', 'client_group': 'Cafetería'},
    {'client_id': 'CLI-007', 'client_name': 'Starbucks Centro', 'client_group': 'Cafetería'},
    {'client_id': 'CLI-008', 'client_name': 'Cafetería La Taza', 'client_group': 'Cafetería'},
    
    # Panaderías
    {'client_id': 'CLI-009', 'client_name': 'Panadería San Miguel', 'client_group': 'Panadería'},
    {'client_id': 'CLI-010', 'client_name': 'Panadería El Globo', 'client_group': 'Panadería'},
    {'client_id': 'CLI-011', 'client_name': 'Panadería Artesanal La Espiga', 'client_group': 'Panadería'},
    
    # Hoteles
    {'client_id': 'CLI-012', 'client_name': 'Hotel Gran Plaza', 'client_group': 'Hotel'},
    {'client_id': 'CLI-013', 'client_name': 'Hotel Fiesta Inn', 'client_group': 'Hotel'},
    {'client_id': 'CLI-014', 'client_name': 'Hotel Boutique Colonial', 'client_group': 'Hotel'},
    
    # Comedores
    {'client_id': 'CLI-015', 'client_name': 'Comedor Industrial Maquiladora Norte', 'client_group': 'Comedor Industrial'},
    {'client_id': 'CLI-016', 'client_name': 'Comedor Escolar Primaria Juárez', 'client_group': 'Comedor Escolar'},
    {'client_id': 'CLI-017', 'client_name': 'Comedor Hospital General', 'client_group': 'Comedor Institucional'},
    
    # Supermercados pequeños
    {'client_id': 'CLI-018', 'client_name': 'Abarrotes Don Juan', 'client_group': 'Tienda de Abarrotes'},
    {'client_id': 'CLI-019', 'client_name': 'Minisuper La Esquina', 'client_group': 'Tienda de Abarrotes'},
    {'client_id': 'CLI-020', 'client_name': 'Tienda de la Esquina', 'client_group': 'Tienda de Abarrotes'},
    
    # Servicios de Catering
    {'client_id': 'CLI-021', 'client_name': 'Banquetes y Eventos El Festín', 'client_group': 'Catering'},
    {'client_id': 'CLI-022', 'client_name': 'Catering Gourmet Premium', 'client_group': 'Catering'},
    
    # Otros
    {'client_id': 'CLI-023', 'client_name': 'Food Truck El Trompo Loco', 'client_group': 'Food Truck'},
    {'client_id': 'CLI-024', 'client_name': 'Carnicería La Central', 'client_group': 'Carnicería'},
    {'client_id': 'CLI-025', 'client_name': 'Frutería y Verdulería Fresh Market', 'client_group': 'Frutería'},
]

MOCK_LOCATIONS = [
    {'location_id': 'LOC-001', 'location_name': 'Guadalajara Centro'},
    {'location_id': 'LOC-002', 'location_name': 'Monterrey San Pedro'},
    {'location_id': 'LOC-003', 'location_name': 'Ciudad de México Polanco'},
    {'location_id': 'LOC-004', 'location_name': 'Puebla Centro Histórico'},
    {'location_id': 'LOC-005', 'location_name': 'Querétaro El Marqués'},
    {'location_id': 'LOC-006', 'location_name': 'Tijuana Zona Río'},
    {'location_id': 'LOC-007', 'location_name': 'León Zona Industrial'},
    {'location_id': 'LOC-008', 'location_name': 'Mérida Norte'},
    {'location_id': 'LOC-009', 'location_name': 'Cancún Hotel Zone'},
    {'location_id': 'LOC-010', 'location_name': 'San Luis Potosí Centro'},
    {'location_id': 'LOC-011', 'location_name': 'Aguascalientes Zona Industrial'},
    {'location_id': 'LOC-012', 'location_name': 'Toluca Metepec'},
    {'location_id': 'LOC-013', 'location_name': 'Hermosillo Norte'},
    {'location_id': 'LOC-014', 'location_name': 'Chihuahua Centro'},
    {'location_id': 'LOC-015', 'location_name': 'Veracruz Puerto'},
]


def get_bedrock_client():
    """Initialize Bedrock client"""
    return boto3.client(
        service_name='bedrock-runtime',
        region_name=AWS_REGION
    )


def get_embedding(text, bedrock_client):
    """Get embedding vector from Bedrock Titan"""
    try:
        body = json.dumps({
            "inputText": text
        })
        
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=body,
            contentType='application/json',
            accept='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        embedding = response_body.get('embedding')
        
        return embedding
    except ClientError as e:
        print(f"Error getting embedding for '{text}': {e}")
        return None


def wait_for_db():
    """Wait for database to be ready"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            conn.close()
            print("✓ Database is ready!")
            return True
        except psycopg2.OperationalError:
            retry_count += 1
            print(f"Waiting for database... ({retry_count}/{max_retries})")
            time.sleep(2)
    
    print("✗ Database not available after maximum retries")
    return False


def check_data_exists():
    """Check if data already exists in tables"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM products")
        product_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return product_count > 0
    except Exception as e:
        print(f"Error checking existing data: {e}")
        return False


def populate_products(bedrock_client):
    """Populate products table with embeddings"""
    print("\n📦 Populating products...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    for product in MOCK_PRODUCTS:
        print(f"  Processing: {product['product_name']}")
        
        # Get embeddings
        name_embedding = get_embedding(product['product_name'], bedrock_client)
        brand_embedding = get_embedding(product['product_brand'], bedrock_client)
        
        if name_embedding and brand_embedding:
            cur.execute("""
                INSERT INTO products (product_id, product_name, vt_product_name, product_brand, vt_product_brand)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (product_id) DO NOTHING
            """, (
                product['product_id'],
                product['product_name'],
                name_embedding,
                product['product_brand'],
                brand_embedding
            ))
        
        time.sleep(0.1)  # Small delay to avoid rate limiting
    
    conn.commit()
    cur.close()
    conn.close()
    print("✓ Products populated successfully!")


def populate_clients(bedrock_client):
    """Populate clients table with embeddings"""
    print("\n👥 Populating clients...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    for client in MOCK_CLIENTS:
        print(f"  Processing: {client['client_name']}")
        
        # Get embeddings
        name_embedding = get_embedding(client['client_name'], bedrock_client)
        group_embedding = get_embedding(client['client_group'], bedrock_client)
        
        if name_embedding and group_embedding:
            cur.execute("""
                INSERT INTO clients (client_id, client_name, client_group, vt_client_name, vt_client_group)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (client_id) DO NOTHING
            """, (
                client['client_id'],
                client['client_name'],
                client['client_group'],
                name_embedding,
                group_embedding
            ))
        
        time.sleep(0.1)
    
    conn.commit()
    cur.close()
    conn.close()
    print("✓ Clients populated successfully!")


def populate_locations(bedrock_client):
    """Populate locations table with embeddings"""
    print("\n📍 Populating locations...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    for location in MOCK_LOCATIONS:
        print(f"  Processing: {location['location_name']}")
        
        # Get embedding
        name_embedding = get_embedding(location['location_name'], bedrock_client)
        
        if name_embedding:
            cur.execute("""
                INSERT INTO locations (location_id, location_name, vt_location_name)
                VALUES (%s, %s, %s)
                ON CONFLICT (location_id) DO NOTHING
            """, (
                location['location_id'],
                location['location_name'],
                name_embedding
            ))
        
        time.sleep(0.1)
    
    conn.commit()
    cur.close()
    conn.close()
    print("✓ Locations populated successfully!")


def main():
    print("🚀 Starting data initialization...")
    
    # Wait for database
    if not wait_for_db():
        exit(1)
    
    # Check if data already exists
    if check_data_exists():
        print("\n✓ Data already exists in database. Skipping initialization.")
        return
    
    # Initialize Bedrock client
    print("\n🔧 Initializing AWS Bedrock client...")
    try:
        bedrock_client = get_bedrock_client()
        print("✓ Bedrock client initialized!")
    except Exception as e:
        print(f"✗ Error initializing Bedrock client: {e}")
        print("⚠️  Make sure AWS credentials are configured properly")
        exit(1)
    
    # Populate tables
    try:
        populate_products(bedrock_client)
        populate_clients(bedrock_client)
        populate_locations(bedrock_client)
        
        print("\n" + "="*50)
        print("✅ Data initialization completed successfully!")
        print("="*50)
        
    except Exception as e:
        print(f"\n✗ Error during data population: {e}")
        exit(1)


if __name__ == "__main__":
    main()

