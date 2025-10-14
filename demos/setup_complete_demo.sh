#!/bin/bash

echo "=============================================================="
echo "🚀 Complete Demo Setup - Vector Database with Mock Data"
echo "=============================================================="
echo ""

# Step 1: Populate mock data
echo "📝 Step 1/2: Creating mock data in 'client_data' database..."
echo ""
python populate_mock_data.py

if [ $? -ne 0 ]; then
    echo "❌ Error creating mock data"
    exit 1
fi

echo ""
echo "=============================================================="
echo ""

# Step 2: Sync to vector database
echo "🔄 Step 2/2: Syncing mock data to vector database..."
echo ""
echo "y" | python sync_mock_data_to_vector_db.py

if [ $? -ne 0 ]; then
    echo "❌ Error syncing to vector database"
    exit 1
fi

echo ""
echo "=============================================================="
echo "✅ Demo setup complete!"
echo "=============================================================="
echo ""
echo "💡 Try these example searches:"
echo ""
echo "  Products by name:"
echo "    python search_products_by_name.py 'tortillas de maíz'"
echo "    python search_products_by_name.py 'salsa picante'"
echo ""
echo "  Products by brand:"
echo "    python search_products_by_brand.py 'El Molino'"
echo "    python search_products_by_brand.py 'La Abuela'"
echo ""
echo "  Clients by name:"
echo "    python search_clients_by_name.py 'taquería'"
echo "    python search_clients_by_name.py 'restaurante'"
echo ""
echo "  Clients by group:"
echo "    python search_clients_by_group.py 'restaurantes'"
echo "    python search_clients_by_group.py 'supermercados'"
echo ""
echo "  Locations:"
echo "    python search_locations.py 'bodega de alimentos'"
echo "    python search_locations.py 'centro de distribución'"
echo ""

