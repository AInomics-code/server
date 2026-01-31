#!/bin/bash
# Script to create initial admin user with environment variables
# This runs as part of docker-entrypoint-initdb.d

set -e

# Get environment variables with defaults
ADMIN_EMAIL="${INITIAL_ADMIN_EMAIL:-admin@vorta.com}"
ADMIN_PASSWORD="${INITIAL_ADMIN_PASSWORD:-admin123}"
ADMIN_NAME="${INITIAL_ADMIN_NAME:-Admin}"
ADMIN_LAST_NAME="${INITIAL_ADMIN_LAST_NAME:-User}"

# Execute SQL with variables
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    DECLARE
        user_count INTEGER;
    BEGIN
        -- Count existing users
        SELECT COUNT(*) INTO user_count FROM users;
        
        -- Only create admin if no users exist
        IF user_count = 0 THEN
            -- Insert initial admin user with bcrypt-hashed password
            -- Using crypt with 'bf' (blowfish/bcrypt) algorithm
            INSERT INTO users (email, password_hash, name, last_name, admin)
            VALUES (
                '$ADMIN_EMAIL',
                crypt('$ADMIN_PASSWORD', gen_salt('bf', 12)),
                '$ADMIN_NAME',
                '$ADMIN_LAST_NAME',
                true
            );
            
            RAISE NOTICE 'Initial admin user created: $ADMIN_EMAIL';
        ELSE
            RAISE NOTICE 'Users already exist, skipping initial admin creation';
        END IF;
    END \$\$;
    
    SELECT 'Initial admin user creation script completed' AS status;
EOSQL
