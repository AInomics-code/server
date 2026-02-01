# Guía Rápida: Setup Manual de Usuarios en DB Existente

## 🎯 Escenario
Tu base de datos PostgreSQL ya existe con datos. Necesitas agregar la tabla de usuarios y crear el admin inicial **sin perder datos existentes**.

---

## ✅ Opción 1: Ejecutar Script SQL (Recomendado)

### Paso 1: Editar credenciales en el script

```bash
cd ~/server_dev  # o tu directorio del proyecto

# Editar el script y cambiar estos valores según tu .env:
# - 'admin@vorta.com' -> tu INITIAL_ADMIN_EMAIL
# - 'admin123' -> tu INITIAL_ADMIN_PASSWORD
# - 'Admin' -> tu INITIAL_ADMIN_NAME
# - 'User' -> tu INITIAL_ADMIN_LAST_NAME
nano init-scripts/manual-setup-users.sql
```

### Paso 2: Copiar el script al contenedor

```bash
docker cp init-scripts/manual-setup-users.sql server_dev-postgres-1:/tmp/setup.sql
```

### Paso 3: Ejecutar el script

```bash
docker compose exec postgres psql -U postgres -d main_db -f /tmp/setup.sql
```

**Resultado esperado:**
```
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
DROP TRIGGER
CREATE TRIGGER
NOTICE:  ✅ Initial admin user created successfully!
      status           
-----------------------
 Setup completed successfully!
(1 row)

 total_users | admin_users 
-------------+-------------
           1 |           1
(1 row)

       email       | name  | last_name | admin |         created_at         
-------------------+-------+-----------+-------+----------------------------
 admin@vorta.com   | Admin | User      | t     | 2026-02-01 00:15:23.456789
(1 row)
```

---

## ✅ Opción 2: Comandos SQL Directos

### Paso 1: Conectar a PostgreSQL

```bash
docker compose exec postgres psql -U postgres -d main_db
```

### Paso 2: Ejecutar comandos SQL uno por uno

```sql
-- 1. Habilitar extensión de encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crear tabla users
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(admin);

-- 4. Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Crear usuario admin (⚠️ CAMBIA LOS VALORES)
INSERT INTO users (email, password_hash, name, last_name, admin)
VALUES (
    'admin@vorta.com',  -- ⚠️ TU EMAIL
    crypt('admin123', gen_salt('bf', 12)),  -- ⚠️ TU PASSWORD
    'Admin',  -- ⚠️ TU NOMBRE
    'User',   -- ⚠️ TU APELLIDO
    true
);

-- 7. Verificar
SELECT email, name, last_name, admin FROM users;

-- 8. Salir
\q
```

---

## ✅ Opción 3: Script Bash Automático

### Paso 1: Crear script bash

```bash
nano setup-users-db.sh
```

```bash
#!/bin/bash
# Script para configurar usuarios en DB existente

set -e

# Lee las variables de tu .env
source .env

# Ejecuta el setup
docker compose exec -T postgres psql -U postgres -d main_db <<EOSQL
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(admin);

-- Create function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user (uses env variables)
DO \$\$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        INSERT INTO users (email, password_hash, name, last_name, admin)
        VALUES (
            '${INITIAL_ADMIN_EMAIL}',
            crypt('${INITIAL_ADMIN_PASSWORD}', gen_salt('bf', 12)),
            '${INITIAL_ADMIN_NAME}',
            '${INITIAL_ADMIN_LAST_NAME}',
            true
        );
        RAISE NOTICE 'Admin user created: ${INITIAL_ADMIN_EMAIL}';
    ELSE
        RAISE NOTICE 'Users already exist, skipping';
    END IF;
END \$\$;

-- Verify
SELECT email, name, admin FROM users;
EOSQL

echo "✅ Setup completed!"
```

### Paso 2: Ejecutar

```bash
chmod +x setup-users-db.sh
./setup-users-db.sh
```

---

## 🔍 Verificación

### Verificar que la tabla se creó

```bash
docker compose exec postgres psql -U postgres -d main_db -c "\dt users"
```

### Verificar que el admin existe

```bash
docker compose exec postgres psql -U postgres -d main_db -c "SELECT email, name, admin FROM users;"
```

### Probar el login

```bash
# Lee tu .env para obtener las credenciales
source .env

# Prueba login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${INITIAL_ADMIN_EMAIL}\",
    \"password\": \"${INITIAL_ADMIN_PASSWORD}\"
  }"
```

**Deberías recibir un JWT token:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid...",
    "email": "admin@vorta.com",
    "name": "Admin",
    "last_name": "User",
    "admin": true
  }
}
```

---

## ⚠️ Troubleshooting

### Error: "relation users already exists"

**Solución:** Es normal, significa que la tabla ya fue creada. Continúa con el siguiente comando.

### Error: "duplicate key value violates unique constraint"

**Solución:** El usuario admin ya existe. Verifica con:

```bash
docker compose exec postgres psql -U postgres -d main_db -c "SELECT * FROM users;"
```

### Error: "function crypt does not exist"

**Solución:** La extensión pgcrypto no está habilitada:

```bash
docker compose exec postgres psql -U postgres -d main_db -c "CREATE EXTENSION pgcrypto;"
```

### Error: Backend no se conecta después del setup

**Solución:** Reinicia el backend:

```bash
docker compose restart backend
docker compose logs backend -f
```

### Olvidé mi password de admin

**Solución:** Resetear la contraseña:

```bash
docker compose exec postgres psql -U postgres -d main_db

-- Dentro de psql:
UPDATE users 
SET password_hash = crypt('nueva_password_123', gen_salt('bf', 12))
WHERE email = 'admin@vorta.com';

\q
```

---

## 📝 Checklist de Setup

- [ ] Verificar que PostgreSQL está corriendo: `docker compose ps postgres`
- [ ] Verificar variables en `.env`: `cat .env | grep INITIAL_ADMIN`
- [ ] Ejecutar script SQL para crear tabla users
- [ ] Verificar tabla creada: `\dt users` en psql
- [ ] Verificar admin creado: `SELECT * FROM users;`
- [ ] Reiniciar backend: `docker compose restart backend`
- [ ] Probar login: `curl -X POST http://localhost:8000/api/auth/login ...`
- [ ] Verificar que otros endpoints funcionan con JWT

---

## 🚀 Siguiente Paso

Una vez que el setup esté completo:

1. **Verificar el backend:**
   ```bash
   docker compose logs backend -f
   ```

2. **Probar autenticación:**
   ```bash
   # Ejecutar el script de testing
   chmod +x backend/test_auth.sh
   ./backend/test_auth.sh
   ```

3. **Leer documentación frontend:**
   ```bash
   cat backend/FRONTEND_AUTH_API.md
   ```

---

## 📞 Ayuda Rápida

```bash
# Ver estructura de la tabla
docker compose exec postgres psql -U postgres -d main_db -c "\d users"

# Listar usuarios
docker compose exec postgres psql -U postgres -d main_db -c "SELECT email, name, admin FROM users;"

# Crear usuario manualmente
docker compose exec postgres psql -U postgres -d main_db -c "
INSERT INTO users (email, password_hash, name, last_name, admin)
VALUES ('test@example.com', crypt('password123', gen_salt('bf', 12)), 'Test', 'User', false);
"

# Eliminar usuario
docker compose exec postgres psql -U postgres -d main_db -c "DELETE FROM users WHERE email = 'test@example.com';"
```
