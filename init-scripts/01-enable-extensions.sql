-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable TDS Foreign Data Wrapper
CREATE EXTENSION IF NOT EXISTS tds_fdw;

-- Optional: Show installed extensions
SELECT extname, extversion FROM pg_extension ORDER BY extname;

