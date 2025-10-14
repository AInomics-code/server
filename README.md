# Services Docker Compose

This docker-compose setup provides a complete stack of services that can communicate with each other, with automatic data initialization using AWS Bedrock embeddings.

## Services

### 1. n8n (Workflow Automation)
- **Port**: 5678
- **Web UI**: http://localhost:5678
- **Default Credentials**:
  - Username: `admin`
  - Password: `admin123`
- **Network Name**: `n8n`

### 2. PostgreSQL with pgvector
- **Port**: 5432
- **Default Credentials**:
  - User: `postgres`
  - Password: `postgres123`
  - Database: `main_db`
- **Network Name**: `postgres`
- **Extensions**: pgvector (for vector similarity search)

#### Additional Database for n8n
- Database: `n8n`
- User: `n8n_user`
- Password: `n8n_password`

#### Pre-populated Tables with Vector Embeddings
The database includes three tables automatically populated with mock data and real embeddings from AWS Bedrock (Titan Embed Text v1):

**Products Table (63 food products):**
- `product_id` (VARCHAR) - Unique product identifier
- `product_name` (VARCHAR) - Product name (e.g., "Leche Entera Lala 1L")
- `vt_product_name` (vector) - Embedding of product name
- `product_brand` (VARCHAR) - Brand name (e.g., "Lala", "Bimbo", "La Costeña")
- `vt_product_brand` (vector) - Embedding of brand name
- Categories: Dairy, Bakery, Meats, Fruits & Vegetables, Pantry, Canned Goods, Beverages, Snacks, Frozen

**Clients Table (25 food industry clients):**
- `client_id` (VARCHAR) - Unique client identifier
- `client_name` (VARCHAR) - Client name (e.g., "Restaurante La Tradición")
- `client_group` (VARCHAR) - Client segment (e.g., "Restaurante", "Cafetería", "Panadería")
- `vt_client_name` (vector) - Embedding of client name
- `vt_client_group` (vector) - Embedding of client group
- Categories: Restaurants, Cafeterias, Bakeries, Hotels, Industrial Cafeterias, Grocery Stores, Catering

**Locations Table (15 Mexican cities):**
- `location_id` (VARCHAR) - Unique location identifier
- `location_name` (VARCHAR) - Location name (e.g., "Guadalajara Centro", "Monterrey San Pedro")
- `vt_location_name` (vector) - Embedding of location name

### 3. Redis
- **Port**: 6379
- **Password**: `redis123`
- **Network Name**: `redis`
- **Persistence**: Enabled (AOF)

### 4. Data Initializer (Auto-run once)
- **Purpose**: Automatically populates the database with mock data and Bedrock embeddings
- **Runs**: Once on first startup, then exits
- **Requirements**: AWS credentials configured

## Network Communication

All services are connected through the `services_network` bridge network, allowing them to communicate using their service names as hostnames.

### Connection Examples

#### From n8n to PostgreSQL:
```
Host: postgres
Port: 5432
Database: main_db
User: postgres
Password: postgres123
```

#### From n8n to Redis:
```
Host: redis
Port: 6379
Password: redis123
```

#### From any service to PostgreSQL with pgvector:
```javascript
// Example connection string
const connectionString = 'postgresql://postgres:postgres123@postgres:5432/main_db';
```

#### From any service to Redis:
```javascript
// Example Redis connection
const redis = {
  host: 'redis',
  port: 6379,
  password: 'redis123'
};
```

## Prerequisites

### AWS Credentials Configuration
The data initializer service requires AWS credentials to call Bedrock for generating embeddings.

#### Step 1: Create your .env file
Copy the example file and configure your credentials:
```bash
cp .env.example .env
nano .env  # Or use your preferred editor
```

#### Step 2: Fill in your AWS credentials
Edit the `.env` file with your AWS credentials:
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# Other services are pre-configured with default values
# You can change them if needed
```

#### Alternative: AWS Profile
If you prefer, you can use AWS credentials from `~/.aws/credentials` instead of the .env file. Just comment out the AWS variables in docker-compose.yml.

## Usage

### Start all services:
```bash
# Using the helper script (recommended)
./start.sh

# Or directly with docker compose
docker compose --env-file .env up -d
```

The data-initializer service will automatically run once and populate the database with mock data and embeddings. Watch the logs to see the progress:
```bash
docker compose logs -f data-initializer
```

### View logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f n8n
docker compose logs -f postgres
docker compose logs -f redis
```

### Stop all services:
```bash
docker compose down
```

### Stop and remove volumes (WARNING: deletes all data):
```bash
docker compose down -v
```

### Restart a specific service:
```bash
docker compose restart n8n
```

## Data Persistence

All services use named volumes for data persistence:
- `n8n_data`: n8n workflows and configurations
- `postgres_data`: PostgreSQL databases
- `redis_data`: Redis persistence files

## Health Checks

- **PostgreSQL**: Checks if the database is ready to accept connections
- **Redis**: Pings the Redis server

## Security Notes

⚠️ **IMPORTANT**: The default passwords in this configuration are for development only. 
Change them before deploying to production:

1. Update passwords in `docker-compose.yml`
2. Update passwords in `init-scripts/01-init.sql`
3. Consider using environment variable files (`.env`) for sensitive data

## pgvector Usage

The PostgreSQL instance includes the pgvector extension for storing and querying vector embeddings.

### Example Similarity Searches

#### Find similar products by name (e.g., similar dairy products):
```sql
-- Find products similar to "Leche Entera Lala 1L"
SELECT 
    product_id, 
    product_name, 
    product_brand,
    1 - (vt_product_name <=> (SELECT vt_product_name FROM products WHERE product_id = 'PROD-001')) as similarity
FROM products
WHERE product_id != 'PROD-001'
ORDER BY vt_product_name <=> (SELECT vt_product_name FROM products WHERE product_id = 'PROD-001')
LIMIT 10;
-- This might return: yogurt, queso, crema (other dairy products)
```

#### Find products by brand similarity (e.g., find similar brands to Lala):
```sql
SELECT 
    product_id, 
    product_name, 
    product_brand,
    1 - (vt_product_brand <=> (SELECT vt_product_brand FROM products WHERE product_brand = 'Lala')) as similarity
FROM products
WHERE product_brand != 'Lala'
ORDER BY vt_product_brand <=> (SELECT vt_product_brand FROM products WHERE product_brand = 'Lala')
LIMIT 5;
-- This might return brands like: Alpura, Danone (other dairy brands)
```

#### Find similar clients (e.g., similar to a restaurant):
```sql
-- Find clients similar to "Restaurante La Tradición"
SELECT 
    client_id,
    client_name,
    client_group,
    1 - (vt_client_name <=> (SELECT vt_client_name FROM clients WHERE client_id = 'CLI-001')) as similarity
FROM clients
WHERE client_id != 'CLI-001'
ORDER BY vt_client_name <=> (SELECT vt_client_name FROM clients WHERE client_id = 'CLI-001')
LIMIT 5;
-- This might return: other restaurants, taquerías (similar food establishments)
```

#### Find clients by segment (e.g., all restaurants):
```sql
-- Find clients similar to the "Restaurante" segment
SELECT 
    client_id,
    client_name,
    client_group,
    1 - (vt_client_group <=> (SELECT vt_client_group FROM clients WHERE client_group = 'Restaurante' LIMIT 1)) as similarity
FROM clients
ORDER BY vt_client_group <=> (SELECT vt_client_group FROM clients WHERE client_group = 'Restaurante' LIMIT 1)
LIMIT 10;
```

#### Find locations similar to a specific one:
```sql
-- Find locations similar to "Guadalajara Centro"
SELECT 
    location_id,
    location_name,
    1 - (vt_location_name <=> (SELECT vt_location_name FROM locations WHERE location_id = 'LOC-001')) as similarity
FROM locations
WHERE location_id != 'LOC-001'
ORDER BY vt_location_name <=> (SELECT vt_location_name FROM locations WHERE location_id = 'LOC-001')
LIMIT 5;
-- This might return: other city centers or similar metropolitan areas
```

#### Semantic search: Find all "tortilla" products:
```sql
-- You can search by embedding a query text (but you'd need to embed it first with Bedrock)
-- For now, use a known product as reference
SELECT 
    product_id,
    product_name,
    product_brand,
    1 - (vt_product_name <=> (SELECT vt_product_name FROM products WHERE product_name LIKE '%Tortilla%' LIMIT 1)) as similarity
FROM products
ORDER BY vt_product_name <=> (SELECT vt_product_name FROM products WHERE product_name LIKE '%Tortilla%' LIMIT 1)
LIMIT 10;
```

### Vector Distance Operators
- `<->` : Euclidean distance (L2)
- `<#>` : Negative inner product
- `<=>` : Cosine distance (recommended for normalized embeddings)

## Troubleshooting

### Data initializer fails with AWS credentials error
1. Make sure AWS credentials are properly configured in `.env`
2. Check if your AWS user has permission to access Bedrock
3. Verify the region supports Bedrock: `us-east-1` is recommended
4. Check logs: `docker compose logs data-initializer`

### Data initializer fails with Bedrock access denied
Your AWS IAM user/role needs the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1"
    }
  ]
}
```

### Tables are empty after initialization
1. Check data-initializer logs: `docker compose logs data-initializer`
2. The service runs only once. If you need to re-run it:
   ```bash
   docker compose down -v  # This deletes all data
   docker compose up -d
   ```
3. Or manually run the initializer again:
   ```bash
   docker compose up data-initializer
   ```

### n8n can't connect to PostgreSQL
1. Check if PostgreSQL is healthy: `docker compose ps`
2. Wait a few seconds after starting for the database to initialize
3. Check logs: `docker compose logs postgres`

### Permission errors in PostgreSQL
If you see permission errors, the init script may not have run properly. 
Try: `docker compose down -v && docker compose up -d`

### Redis authentication failed
Make sure to include the password in your connection string or configuration:
```
redis-cli -h localhost -p 6379 -a redis123
```

### Want to skip data initialization?
Comment out or remove the `data-initializer` service from docker-compose.yml. The tables will still be created, just empty.

### Using docker-compose (standalone) vs docker compose (plugin)
This project supports both:
- `docker compose` (modern plugin, recommended)
- `docker-compose` (standalone legacy version)

The documentation uses `docker compose` by default.

