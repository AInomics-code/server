# Deployment Guide - Vorta Server

## 🚀 Quick Start

### 1. Preparar Variables de Entorno

Crea un archivo `.env` en el servidor de producción:

```bash
cd ~/server_dev  # o tu directorio del proyecto
cp .env.example .env
nano .env  # o tu editor preferido
```

### 2. Configurar Variables Obligatorias

Edita `.env` y configura estas variables:

```bash
# AWS Credentials (para embeddings)
AWS_ACCESS_KEY_ID=tu_access_key_real
AWS_SECRET_ACCESS_KEY=tu_secret_key_real
AWS_REGION=us-east-1

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TuPasswordSeguro123!
POSTGRES_DB=main_db

# Redis
REDIS_PASSWORD=TuRedisPassword123!

# JWT - ⚠️ IMPORTANTE: Generar clave segura
# Ejecuta: openssl rand -hex 32
JWT_SECRET_KEY=aqui_va_tu_clave_generada_de_64_caracteres
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Usuario Admin Inicial
# Solo se usa la primera vez que se crea la base de datos
INITIAL_ADMIN_EMAIL=admin@tuempresa.com
INITIAL_ADMIN_PASSWORD=TuPasswordSeguro123!
INITIAL_ADMIN_NAME=Admin
INITIAL_ADMIN_LAST_NAME=Principal
```

### 3. Generar JWT Secret Key Seguro

```bash
# En el servidor de producción, ejecuta:
openssl rand -hex 32
```

Copia el resultado y pégalo en `JWT_SECRET_KEY` en tu `.env`.

### 4. Iniciar Servicios

```bash
docker compose up -d
```

### 5. Verificar Estado

```bash
docker compose ps
docker compose logs backend
```

### 6. Probar Autenticación

```bash
# Login con el usuario admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tuempresa.com",
    "password": "TuPasswordSeguro123!"
  }'
```

Deberías recibir un JWT token.

---

## 📋 Checklist de Deployment

### Pre-deployment
- [ ] Servidor tiene Docker y Docker Compose instalados
- [ ] Puerto 8000 (backend) está disponible
- [ ] Puerto 5434 (PostgreSQL) está disponible si necesitas acceso externo
- [ ] Puerto 6379 (Redis) está disponible
- [ ] Tienes credenciales AWS válidas para Bedrock

### Configuración
- [ ] Archivo `.env` creado desde `.env.example`
- [ ] `JWT_SECRET_KEY` generado con `openssl rand -hex 32`
- [ ] `POSTGRES_PASSWORD` configurado (no usar valores por defecto)
- [ ] `REDIS_PASSWORD` configurado
- [ ] `INITIAL_ADMIN_EMAIL` configurado con email real
- [ ] `INITIAL_ADMIN_PASSWORD` configurado (fuerte)
- [ ] Credenciales AWS configuradas

### Post-deployment
- [ ] `docker compose up -d` ejecutado sin errores
- [ ] Backend saludable: `curl http://localhost:8000/health`
- [ ] Login funciona correctamente
- [ ] Query con JWT funciona
- [ ] Usuario admin puede crear otros usuarios

---

## 🔧 Resolución de Problemas

### Error: Variables de entorno no configuradas

```
WARN[0000] The "INITIAL_ADMIN_EMAIL" variable is not set
```

**Solución:** Crea el archivo `.env` con todas las variables requeridas (ver paso 2).

### Error: Volúmenes ya existen

```
WARN[0000] volume "postgres_data" already exists but was created for project "server"
```

**Solución:** Esto es normal y ya está solucionado. El `docker-compose.yml` ahora usa `external: true` para los volúmenes.

### Error: Puerto ya en uso

```
Error: bind: address already in use
```

**Solución:** 
```bash
# Ver qué está usando el puerto
sudo lsof -i :8000

# Detener el servicio anterior
docker compose down

# O cambiar el puerto en docker-compose.yml
```

### Error: Backend no inicia

```bash
# Ver logs detallados
docker compose logs backend -f

# Reconstruir la imagen
docker compose build --no-cache backend
docker compose up -d backend
```

### Error: No se puede conectar a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps postgres

# Ver logs de PostgreSQL
docker compose logs postgres

# Verificar que la password en .env coincida
```

### Password de PostgreSQL se "cambia sola"

**Causa:** Volúmenes de Docker mantienen passwords antiguas.

**Solución:**
```bash
# Opción 1: Actualizar password manualmente en el contenedor
docker compose exec postgres psql -U postgres
ALTER USER postgres WITH PASSWORD 'tu_nueva_password';
\q

# Opción 2: Recrear volúmenes (⚠️ BORRA TODOS LOS DATOS)
docker compose down -v
docker compose up -d
```

### Usuario admin no existe

Si la base de datos ya existía antes de agregar el sistema de usuarios:

```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U postgres -d main_db

# Crear manualmente el usuario admin
INSERT INTO users (user_id, email, password_hash, name, last_name, admin)
VALUES (
  gen_random_uuid(),
  'admin@tuempresa.com',
  crypt('TuPassword123!', gen_salt('bf', 12)),
  'Admin',
  'Principal',
  true
);

# Verificar
SELECT email, name, admin FROM users;
\q
```

---

## 🔒 Seguridad en Producción

### 1. JWT Secret Key
- ⚠️ **NUNCA** usar valores por defecto en producción
- Generar con `openssl rand -hex 32`
- Mínimo 32 caracteres
- No compartir ni commitear en Git

### 2. Passwords
- PostgreSQL: usar passwords fuertes (min 16 caracteres)
- Redis: usar passwords fuertes
- Admin inicial: cambiar después del primer login

### 3. Firewall
```bash
# Permitir solo tráfico necesario
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# NO exponer directamente:
# - Puerto 5434 (PostgreSQL) - solo acceso interno
# - Puerto 6379 (Redis) - solo acceso interno
```

### 4. HTTPS
Usar un reverse proxy como Nginx con Let's Encrypt:

```nginx
# /etc/nginx/sites-available/vorta
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d api.tudominio.com
```

### 5. Variables Sensibles
```bash
# Proteger el archivo .env
chmod 600 .env
chown ubuntu:ubuntu .env  # o tu usuario

# Nunca commitear .env en Git
# Ya está en .gitignore
```

---

## 🔄 Actualizar el Sistema

### Actualizar código

```bash
cd ~/server_dev
git pull origin develop  # o tu branch

# Reconstruir solo si cambiaron requirements.txt o Dockerfile
docker compose build backend

# Reiniciar
docker compose up -d
```

### Actualizar solo configuración

```bash
# Editar .env
nano .env

# Reiniciar backend para aplicar cambios
docker compose restart backend
```

### Rollback en caso de error

```bash
# Volver a commit anterior
git log --oneline  # ver historial
git checkout <commit-hash>

# Reconstruir y reiniciar
docker compose build backend
docker compose up -d
```

---

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
# Backend
docker compose logs backend -f

# PostgreSQL
docker compose logs postgres -f

# Redis
docker compose logs redis -f

# Todos
docker compose logs -f
```

### Health Check

```bash
# Backend
curl http://localhost:8000/health

# PostgreSQL (desde dentro del contenedor)
docker compose exec postgres pg_isready -U postgres

# Redis
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping
```

### Uso de recursos

```bash
# CPU y memoria de contenedores
docker stats

# Espacio en disco
df -h
docker system df
```

---

## 📦 Backup y Restore

### Backup de PostgreSQL

```bash
# Crear backup
docker compose exec postgres pg_dump -U postgres main_db > backup_$(date +%Y%m%d).sql

# O con compresión
docker compose exec postgres pg_dump -U postgres main_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore de PostgreSQL

```bash
# Restaurar backup
cat backup_20260131.sql | docker compose exec -T postgres psql -U postgres main_db

# O desde archivo comprimido
gunzip -c backup_20260131.sql.gz | docker compose exec -T postgres psql -U postgres main_db
```

### Backup automático (cron)

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * cd ~/server_dev && docker compose exec postgres pg_dump -U postgres main_db | gzip > ~/backups/vorta_$(date +\%Y\%m\%d).sql.gz

# Crear directorio de backups
mkdir -p ~/backups
```

---

## 🌐 Variables de Entorno Completas

### Backend (FastAPI)

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key para Bedrock | `AKIAIOSFODNN7EXAMPLE` | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | `wJalrXUtnFEMI/K7MDENG/...` | ✅ |
| `AWS_REGION` | Región AWS | `us-east-1` | ✅ |
| `POSTGRES_USER` | Usuario PostgreSQL | `postgres` | ✅ |
| `POSTGRES_PASSWORD` | Password PostgreSQL | `postgres123` | ✅ |
| `POSTGRES_DB` | Base de datos | `main_db` | ✅ |
| `POSTGRES_HOST` | Host PostgreSQL | `postgres` (nombre servicio) | Auto |
| `POSTGRES_PORT` | Puerto PostgreSQL | `5432` (interno) | Auto |
| `REDIS_HOST` | Host Redis | `redis` (nombre servicio) | Auto |
| `REDIS_PORT` | Puerto Redis | `6379` | Auto |
| `REDIS_PASSWORD` | Password Redis | `redis123` | ✅ |
| `JWT_SECRET_KEY` | Clave secreta JWT | (64 chars hex) | ✅ |
| `JWT_ALGORITHM` | Algoritmo JWT | `HS256` | ✅ |
| `JWT_EXPIRATION_MINUTES` | Expiración token | `60` | ✅ |

### PostgreSQL (Init Scripts)

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `INITIAL_ADMIN_EMAIL` | Email admin inicial | `admin@empresa.com` | ✅ |
| `INITIAL_ADMIN_PASSWORD` | Password admin | `SecurePass123!` | ✅ |
| `INITIAL_ADMIN_NAME` | Nombre admin | `Admin` | ✅ |
| `INITIAL_ADMIN_LAST_NAME` | Apellido admin | `Principal` | ✅ |

---

## 📚 Recursos Adicionales

- **Documentación Backend**: `backend/AUTH_README.md`
- **Documentación Frontend**: `backend/FRONTEND_AUTH_API.md`
- **Implementación**: `backend/IMPLEMENTATION_SUMMARY.md`
- **Testing**: `backend/test_auth.sh`

---

## ⚡ Quick Commands Reference

```bash
# Iniciar todo
docker compose up -d

# Ver estado
docker compose ps

# Ver logs
docker compose logs -f

# Reiniciar un servicio
docker compose restart backend

# Detener todo
docker compose down

# Detener y eliminar volúmenes (⚠️ BORRA DATOS)
docker compose down -v

# Reconstruir sin cache
docker compose build --no-cache

# Entrar a contenedor
docker compose exec backend bash
docker compose exec postgres psql -U postgres -d main_db

# Health checks
curl http://localhost:8000/health
curl http://localhost:8000/api/auth/me -H "Authorization: Bearer TOKEN"
```

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa logs: `docker compose logs backend -f`
2. Verifica variables: `cat .env`
3. Verifica estado: `docker compose ps`
4. Revisa documentación: `backend/AUTH_README.md`

**Logs importantes:**
- Backend: `docker compose logs backend`
- PostgreSQL init: `docker compose logs postgres | grep "admin"`
- Errores auth: `docker compose logs backend | grep -i "auth\|jwt\|password"`
