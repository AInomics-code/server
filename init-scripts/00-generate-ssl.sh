#!/bin/bash
# Generate self-signed SSL certificates for PostgreSQL
set -e

SSL_DIR="/var/lib/postgresql/data"

# Only generate if certificates don't exist
if [ ! -f "$SSL_DIR/server.crt" ] || [ ! -f "$SSL_DIR/server.key" ]; then
    echo "Generating SSL certificates..."
    openssl req -new -x509 -days 365 -nodes -text \
        -out "$SSL_DIR/server.crt" \
        -keyout "$SSL_DIR/server.key" \
        -subj "/CN=postgres"
    
    chmod 600 "$SSL_DIR/server.key"
    chmod 644 "$SSL_DIR/server.crt"
    chown postgres:postgres "$SSL_DIR/server.crt" "$SSL_DIR/server.key"
    echo "SSL certificates generated successfully."
else
    echo "SSL certificates already exist, skipping generation."
fi
