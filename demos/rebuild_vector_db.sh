#!/bin/bash
# Rebuild vector database with new embedding dimensions

set -e

echo "======================================================================"
echo "🔄 REBUILDING VECTOR DATABASE (v2 - 1024 dimensions)"
echo "======================================================================"
echo ""

# Database credentials
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="postgres123"
DB_NAME="main_db"

echo "⏳ Step 1: Dropping existing vector tables..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tables dropped successfully"
else
    echo "❌ Error dropping tables"
    exit 1
fi

echo ""
echo "⏳ Step 2: Creating new tables with updated dimensions..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../init-scripts/02-create-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully"
else
    echo "❌ Error creating tables"
    exit 1
fi

echo ""
echo "⏳ Step 3: Syncing DBT data and generating embeddings..."
cd "$(dirname "$0")"
python sync_dbt_to_vector_db.py --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo "✅ VECTOR DATABASE REBUILD COMPLETE!"
    echo "======================================================================"
    echo ""
    echo "You can now:"
    echo "  • Test product search: python search_products_by_name.py 'tortillas'"
    echo "  • Test client search: python search_clients_by_name.py 'restaurant'"
    echo "  • Test location search: python search_locations.py 'bodega'"
    echo ""
else
    echo "❌ Error syncing data"
    exit 1
fi

