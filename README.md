# Services Docker Compose

This docker-compose setup provides a complete stack of services that can communicate with each other.

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

### 3. Redis
- **Port**: 6379
- **Password**: `redis123`
- **Network Name**: `redis`
- **Persistence**: Enabled (AOF)

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

## Usage

### Start all services:
```bash
docker-compose up -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f n8n
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Stop all services:
```bash
docker-compose down
```

### Stop and remove volumes (WARNING: deletes all data):
```bash
docker-compose down -v
```

### Restart a specific service:
```bash
docker-compose restart n8n
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

### Example usage:
```sql
-- Create a table with a vector column
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  embedding vector(1536)
);

-- Insert vectors
INSERT INTO items (embedding) VALUES ('[1,2,3,...]');

-- Find similar vectors
SELECT * FROM items 
ORDER BY embedding <-> '[1,2,3,...]' 
LIMIT 5;
```

## Troubleshooting

### n8n can't connect to PostgreSQL
1. Check if PostgreSQL is healthy: `docker-compose ps`
2. Wait a few seconds after starting for the database to initialize
3. Check logs: `docker-compose logs postgres`

### Permission errors in PostgreSQL
If you see permission errors, the init script may not have run properly. 
Try: `docker-compose down -v && docker-compose up -d`

### Redis authentication failed
Make sure to include the password in your connection string or configuration:
```
redis-cli -h localhost -p 6379 -a redis123
```

