-- Initialize PostgreSQL with pgvector extension

-- Create pgvector extension in main database
CREATE EXTENSION IF NOT EXISTS vector;

-- Create n8n database and user
CREATE DATABASE n8n;
CREATE USER n8n_user WITH ENCRYPTED PASSWORD 'n8n_password';
GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n_user;

-- Connect to n8n database and grant schema privileges
\c n8n;
GRANT ALL ON SCHEMA public TO n8n_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n8n_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n8n_user;

-- Create pgvector extension in n8n database as well
CREATE EXTENSION IF NOT EXISTS vector;

-- Back to main database
\c main_db;

-- Log success
SELECT 'Database initialization completed successfully' AS status;

