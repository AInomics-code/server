# 📚 Guía de Sincronización de Base de Datos Vectorial

## 🎯 Resumen

Este documento explica cómo sincronizar los datos transformados por DBT desde `client_data.public` hacia la base de datos vectorial `main_db` con embeddings de AWS Bedrock.

## 🆕 Nuevas Características

### ✨ Búsqueda por Categoría de Productos

Ahora puedes buscar productos de tres formas diferentes:

1. **Por nombre del producto**: `category="products"`
2. **Por marca**: `category="products_by_brand"` 
3. **Por categoría**: `category="products_by_category"`

Ejemplo:
```python
# Buscar productos de una categoría específica
result = await vector_search.execute("lácteos", category="products_by_category")

# Buscar productos de una marca específica  
result = await vector_search.execute("Lala", category="products_by_brand")

# Buscar productos por nombre
result = await vector_search.execute("leche entera", category="products")
```

## 📋 Estructura de Datos

### Tablas en `client_data.public` (DBT Materializadas)

#### **Products**
```sql
SELECT 
    product_id,      -- Código del producto
    product_name,    -- Nombre del producto
    brand,           -- Marca
    category,        -- Categoría (ej: "Lácteos", "Panadería")
    state            -- Estado activo (boolean)
FROM public.products
WHERE state = true
```

#### **Clients**
```sql
SELECT 
    client_id,       -- Código del cliente
    client_name,     -- Nombre del cliente
    client_group     -- Grupo del cliente
FROM public.clients
```

#### **Locations**
```sql
SELECT 
    location_id,     -- Código del depósito/ubicación
    location_name    -- Nombre de la ubicación
FROM public.locations
```

### Tablas en `main_db` (Base de Datos Vectorial)

#### **Products con Vectores**
```sql
- product_id (PK)
- product_name
- vt_product_name (vector 1024)        -- Embedding del nombre
- product_brand
- vt_product_brand (vector 1024)       -- Embedding de la marca
- product_category
- vt_product_category (vector 1024)    -- Embedding de la categoría ✨ NUEVO
- created_at
- updated_at
```

## 🚀 Cómo Sincronizar

### Opción 1: Primera vez (Con Migración)

Si tu base de datos vectorial no tiene la columna `product_category`:

```bash
# Paso 1: Aplicar la migración
cd /home/jeff/Documents/vorta/server/demos
psql -h localhost -p 5432 -U postgres -d main_db -f migrate_add_category.sql

# Paso 2: Sincronizar datos
python sync_dbt_to_vector_db.py --yes
```

### Opción 2: Actualización Regular

Si ya tienes la estructura correcta y solo quieres actualizar datos:

```bash
cd /home/jeff/Documents/vorta/server/demos
python sync_dbt_to_vector_db.py --yes
```

### Opción 3: Interactivo (con confirmaciones)

```bash
cd /home/jeff/Documents/vorta/server/demos
python sync_dbt_to_vector_db.py
```

El script te preguntará si quieres limpiar las tablas existentes antes de sincronizar.

## 📊 Qué hace el script de sincronización

1. **Conecta** a ambas bases de datos (`client_data` y `main_db`)
2. **Lee** los datos transformados por DBT desde `client_data.public`
3. **Genera embeddings** usando AWS Bedrock Titan Embed Text v2 (1024 dimensiones) para:
   - Nombre del producto
   - Marca del producto
   - Categoría del producto
4. **Inserta/Actualiza** los datos en `main_db` con `UPSERT`
5. **Muestra resumen** de productos, clientes y ubicaciones sincronizados

## ⚙️ Configuración

### Variables de Entorno

Asegúrate de tener configurado el archivo `.env` en `/home/jeff/Documents/vorta/server/.env`:

```env
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=main_db
```

### Permisos AWS

Tu usuario/rol de AWS necesita:

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0"
}
```

## 🔍 Ejemplos de Uso en el Backend

### Buscar productos por categoría

```python
from tools.vector_search import VectorSearchTool

vector_tool = VectorSearchTool()

# Buscar productos de categoría "lácteos"
result = await vector_tool.execute(
    "lácteos", 
    category="products_by_category",
    limit=10
)

# Resultado:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "PROD-001",
#       "name": "Leche Entera Lala 1L",
#       "additional": ["Lala", "Lácteos"],
#       "similarity": 0.95
#     },
#     ...
#   ]
# }
```

### Buscar productos por marca

```python
# Buscar todos los productos de marca "Bimbo"
result = await vector_tool.execute(
    "Bimbo", 
    category="products_by_brand",
    limit=20
)
```

### Buscar productos por nombre

```python
# Búsqueda tradicional por nombre
result = await vector_tool.execute(
    "pan integral", 
    category="products",
    limit=5
)
```

## 📈 Monitoreo y Debugging

### Ver el progreso durante la sincronización

```bash
# El script muestra progreso cada 10 productos:
# ⏳ Progress: 10/63 products (10 synced, 0 errors)
# ⏳ Progress: 20/63 products (20 synced, 0 errors)
# ...
```

### Verificar datos sincronizados

```sql
-- Conectar a main_db
psql -h localhost -p 5432 -U postgres -d main_db

-- Ver productos con categoría
SELECT 
    product_id, 
    product_name, 
    product_brand,
    product_category
FROM products
LIMIT 10;

-- Contar productos por categoría
SELECT 
    product_category, 
    COUNT(*) as total
FROM products
WHERE product_category IS NOT NULL
GROUP BY product_category
ORDER BY total DESC;
```

### Probar búsqueda vectorial

```sql
-- Buscar productos similares por categoría
SELECT 
    product_id,
    product_name,
    product_brand,
    product_category,
    1 - (vt_product_category <=> (
        SELECT vt_product_category 
        FROM products 
        WHERE product_category = 'Lácteos' 
        LIMIT 1
    )) as similarity
FROM products
WHERE vt_product_category IS NOT NULL
ORDER BY vt_product_category <=> (
    SELECT vt_product_category 
    FROM products 
    WHERE product_category = 'Lácteos' 
    LIMIT 1
)
LIMIT 10;
```

## 🔧 Troubleshooting

### Error: Column "product_category" does not exist

**Solución**: Ejecuta la migración primero
```bash
psql -h localhost -p 5432 -U postgres -d main_db -f migrate_add_category.sql
```

### Error: AWS Bedrock credentials

**Solución**: Verifica que tus credenciales estén en `.env` o `~/.aws/credentials`

### Error: Database connection refused

**Solución**: Asegúrate de que PostgreSQL esté corriendo
```bash
docker compose up -d postgres
# o
docker compose ps
```

### Rate limiting de Bedrock

El script incluye un delay de 0.1 segundos entre cada request. Si sigues teniendo problemas, puedes aumentarlo en el código:

```python
time.sleep(0.2)  # Aumentar de 0.1 a 0.2 segundos
```

## 🎯 Próximos Pasos

1. **Automatización**: Configura un cron job para sincronizar periódicamente
2. **Webhook**: Implementa un endpoint en el backend para sincronizar bajo demanda
3. **Incremental**: Modifica el script para solo sincronizar productos actualizados recientemente

## 📞 Soporte

Para más información, consulta:
- README principal: `/home/jeff/Documents/vorta/server/README.md`
- Documentación de DBT: `/home/jeff/Documents/vorta/server/dbt/vorta/README.md`

