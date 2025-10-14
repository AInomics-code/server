# Quick Start Guide

## 1. Configure Environment Variables

Create your `.env` file from the example:

```bash
cp .env.example .env
nano .env  # Or use your preferred editor
```

Fill in your AWS credentials in the `.env` file:
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

## 2. Start Services

### Option A: Using the helper script
```bash
./start.sh
```

### Option B: Direct docker compose
```bash
docker compose --env-file .env up -d
```

## 3. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| n8n | http://localhost:5678 | admin / admin123 |
| PostgreSQL | localhost:5432 | postgres / postgres123 |
| Redis | localhost:6379 | redis123 |

## 4. Connect to Database

### DBeaver Configuration:
- Host: `localhost`
- Port: `5432`
- Database: `main_db`
- User: `postgres`
- Password: `postgres123`

## 5. Verify Data Initialization

```bash
# Watch the initialization process
docker compose logs -f data-initializer

# Once complete, connect to PostgreSQL and run:
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM locations;
```

## 6. Test Vector Similarity Search

```sql
-- Example 1: Find dairy products similar to "Leche"
SELECT 
    product_name,
    product_brand,
    1 - (vt_product_name <=> (
        SELECT vt_product_name 
        FROM products 
        WHERE product_name LIKE '%Leche%'
        LIMIT 1
    )) as similarity
FROM products
WHERE product_name NOT LIKE '%Leche%'
ORDER BY similarity DESC
LIMIT 10;
-- Expected: yogurt, queso, crema (other dairy products)

-- Example 2: Find similar brands to "Lala"
SELECT DISTINCT
    product_brand,
    1 - (vt_product_brand <=> (
        SELECT vt_product_brand 
        FROM products 
        WHERE product_brand = 'Lala'
        LIMIT 1
    )) as similarity
FROM products
WHERE product_brand != 'Lala'
ORDER BY similarity DESC
LIMIT 5;
-- Expected: Alpura, Danone (other dairy brands)

-- Example 3: Find clients similar to restaurants
SELECT 
    client_name,
    client_group,
    1 - (vt_client_group <=> (
        SELECT vt_client_group 
        FROM clients 
        WHERE client_group = 'Restaurante'
        LIMIT 1
    )) as similarity
FROM clients
ORDER BY similarity DESC
LIMIT 10;
```

## Troubleshooting

### Data not populating?
Check the logs:
```bash
docker compose logs data-initializer
```

### Need to re-initialize data?
```bash
docker compose down -v  # WARNING: Deletes all data!
docker compose up -d
```

### Services not starting?
```bash
docker compose ps
docker compose logs
```

## Stopping Services

```bash
# Stop but keep data
docker compose down

# Stop and remove all data (WARNING!)
docker compose down -v
```

