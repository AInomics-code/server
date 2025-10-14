# Vector Search Demo Scripts

This directory contains demo scripts to test vector similarity search across all tables and vector columns in the database.

## 🌮 About the Mock Data

The demo simulates a **food production and distribution company** that manufactures and distributes products like:
- 🫓 Tortillas (maíz, harina, integrales)
- 🌶️ Salsas and condiments (picante, verde, chipotle)
- 🫘 Granos y legumbres (frijoles, arroz, lentejas)
- 🌾 Harinas y masas
- 🛢️ Aceites y grasas
- 🥫 Enlatados y conservas
- 🌿 Chiles y especias
- 🌽 Botanas y snacks

**Clients include**: Taquerías, restaurants, comedores, supermarkets, hotels, tortillerías, and food distributors.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure your `.env` file is configured in the parent directory with AWS credentials.

3. Ensure the Docker services are running:
```bash
cd ..
docker compose ps
```

## Quick Start

To set up everything at once:

```bash
./setup_complete_demo.sh
```

This will:
1. Create the `client_data` database with mock data
2. Sync all data to the vector database with embeddings
3. Ready for vector similarity searches!

---

## Available Scripts

### 0. Populate Mock Data
Generate mock data for testing in a `client_data` database:

```bash
python populate_mock_data.py
```

This script will:
- Create a new database called `client_data`
- Create all necessary tables (locations, products, clients, inventory, backorders, sales)
- Populate them with realistic mock data for a **food production company**
- Generate thousands of records with proper relationships

**Mock Data includes:**
- **Products**: Tortillas, salsas, granos, harinas, aceites, enlatados, especias, botanas
- **Brands**: El Molino, La Abuela, Don Tomate, Tradición, Sabor Casero, etc.
- **Clients**: Taquerías, restaurantes, comedores, supermercados, tortillerías, hoteles
- **Locations**: Bodegas de alimentos, centros de distribución, almacenes refrigerados

**Configuration:**
- 50 locations (food warehouses and distribution centers)
- 500 products (food items with realistic presentations)
- 1000 clients (restaurants, supermarkets, food businesses)
- 2000 inventory records
- 200 backorders
- 5000 sales transactions

---

### 1. Sync Mock Data to Vector Database
Sync mock data from `client_data` database to the main vector database with embeddings:

```bash
python sync_mock_data_to_vector_db.py
```

This script will:
- Read data from the `client_data` database (created by `populate_mock_data.py`)
- Generate embeddings for each record using AWS Bedrock Titan
- Insert the data into the main vector database tables (products, clients, locations)
- Create vector indexes for similarity search

**What it syncs:**
- Products: `product_name` and `product_brand` with embeddings
- Clients: `client_name` and `client_group` with embeddings
- Locations: `location_name` with embeddings

**Note:** This process takes several minutes due to API rate limiting. Progress is shown during execution.

---

### 2. Search Products by Name
Search for products based on product name similarity:

```bash
python search_products_by_name.py "tortillas de maíz"
python search_products_by_name.py "salsa picante"
python search_products_by_name.py "frijoles"
python search_products_by_name.py "aceite vegetal"
```

**Searches in:** `products.vt_product_name`  
**Returns:** product_id, product_name, product_brand, similarity

---

### 3. Search Products by Brand
Search for products based on brand similarity:

```bash
python search_products_by_brand.py "El Molino"
python search_products_by_brand.py "La Abuela"
python search_products_by_brand.py "Don Tomate"
python search_products_by_brand.py "marcas tradicionales"
```

**Searches in:** `products.vt_product_brand`  
**Returns:** product_id, product_name, product_brand, similarity

---

### 4. Search Clients by Name
Search for clients based on client name similarity:

```bash
python search_clients_by_name.py "taquería"
python search_clients_by_name.py "restaurante"
python search_clients_by_name.py "comedor"
python search_clients_by_name.py "supermercado"
```

**Searches in:** `clients.vt_client_name`  
**Returns:** client_id, client_name, client_group, similarity

---

### 5. Search Clients by Group
Search for clients based on client group/category similarity:

```bash
python search_clients_by_group.py "restaurantes"
python search_clients_by_group.py "hoteles"
python search_clients_by_group.py "supermercados"
python search_clients_by_group.py "distribuidores"
```

**Searches in:** `clients.vt_client_group`  
**Returns:** client_id, client_name, client_group, similarity

---

### 6. Search Locations
Search for locations based on location name similarity:

```bash
python search_locations.py "bodega de alimentos"
python search_locations.py "centro de distribución"
python search_locations.py "almacén refrigerado"
python search_locations.py "depósito de granos"
```

**Searches in:** `locations.vt_location_name`  
**Returns:** location_id, location_name, similarity

---

## How It Works

1. **Input:** Each script receives a search query as a string
2. **Embedding:** The query is converted to a 1536-dimensional vector using AWS Bedrock (Titan Embed Text v1)
3. **Vector Search:** The embedding is compared against the specified vector column using cosine distance (`<=>`)
4. **Results:** Returns the top 10 most similar results with similarity scores (0-1, higher is more similar)

## Example Output

```bash
$ python search_products_by_name.py "leche"

🔍 Searching products by name: 'leche'
======================================================================
⏳ Generating embedding...
✓ Embedding generated successfully
⏳ Searching in database...

✅ Found 10 similar products:

Rank   Product ID   Product Name                              Brand                Similarity
----------------------------------------------------------------------------------------------------
1      PROD-001     Leche Entera Lala 1L                     Lala                 0.9234
2      PROD-002     Leche Deslactosada Alpura 1L             Alpura               0.9187
3      PROD-003     Yogurt Natural Danone 1kg                Danone               0.7654
4      PROD-008     Crema Lala 500ml                         Lala                 0.7432
...
```

## Notes

- All scripts use cosine distance for similarity calculation
- Similarity scores range from 0 to 1 (1 = identical, 0 = completely different)
- The scripts automatically load configuration from `../.env`
- Make sure AWS credentials have access to Bedrock (InvokeModel permission)

