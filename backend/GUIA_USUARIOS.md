# Módulo de Usuarios - Guía de Uso

## 🎉 Implementación Completada

Se ha implementado exitosamente el sistema completo de autenticación y gestión de usuarios.

## Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
cd /Users/jeff/Documents/vorta/server
cp .env.example .env
```

Edita el archivo `.env` y configura:

```env
# Configuración JWT (¡CAMBIA LA CLAVE SECRETA!)
JWT_SECRET_KEY=tu-clave-secreta-de-minimo-32-caracteres
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Usuario Admin Inicial
INITIAL_ADMIN_EMAIL=admin@vorta.com
INITIAL_ADMIN_PASSWORD=admin123
INITIAL_ADMIN_NAME=Admin
INITIAL_ADMIN_LAST_NAME=User
```

### 2. Iniciar con Docker

```bash
docker compose down -v  # Limpia todo (opcional)
docker compose up -d
```

El usuario admin se creará automáticamente en el primer arranque.

### 3. Verificar que Todo Funciona

```bash
# Ver logs del backend
docker compose logs -f backend

# Ver logs de postgres
docker compose logs -f postgres
```

## Credenciales por Defecto

- **Email**: `admin@vorta.com`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción editando el archivo `.env`

## Endpoints de la API

### Autenticación

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vorta.com",
    "password": "admin123"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid-aqui",
    "email": "admin@vorta.com",
    "name": "Admin",
    "last_name": "User",
    "admin": true,
    ...
  }
}
```

#### Obtener Usuario Actual
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Gestión de Usuarios (Solo Admin)

#### Crear Usuario
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123",
    "name": "Juan",
    "last_name": "Pérez",
    "admin": false
  }'
```

#### Listar Usuarios
```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Obtener Usuario por ID
```bash
curl -X GET http://localhost:8000/api/users/{user_id} \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Actualizar Usuario
```bash
curl -X PUT http://localhost:8000/api/users/{user_id} \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Nombre",
    "password": "nueva_contraseña"
  }'
```

Todos los campos son opcionales en la actualización.

#### Eliminar Usuario
```bash
curl -X DELETE http://localhost:8000/api/users/{user_id} \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Probar con Conda (Desarrollo Local)

```bash
# Activar entorno conda
conda activate ainomics

# Ir al directorio backend
cd /Users/jeff/Documents/vorta/server/backend

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Script de Pruebas

Existe un script automatizado para probar todos los endpoints:

```bash
cd /Users/jeff/Documents/vorta/server/backend
bash test_auth.sh
```

Este script prueba:
1. Health check
2. Login
3. Obtener usuario actual
4. Crear usuario
5. Listar usuarios
6. Login con nuevo usuario
7. Intentar crear usuario sin permisos (debe fallar)
8. Endpoint de query protegido
9. Actualizar usuario
10. Eliminar usuario

## Estructura de la Base de Datos

```sql
users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Características de Seguridad

✅ Autenticación JWT (tokens sin estado)
✅ Contraseñas hasheadas con bcrypt (factor 12)
✅ Control de acceso basado en roles
✅ Expiración automática de tokens (60 minutos)
✅ Encriptación de contraseñas en BD
✅ Creación automática de admin inicial
✅ Unicidad de emails
✅ Validación de contraseñas (mínimo 8 caracteres)

## Endpoints Protegidos

Todos los siguientes endpoints ahora requieren autenticación:

- `POST /api/query` - Hacer consulta
- `POST /api/query/stream` - Consulta con streaming
- `GET /api/session/{session_id}` - Obtener sesión
- `DELETE /api/session/{session_id}` - Limpiar sesión
- `POST /api/admin/clear-cache` - Limpiar caché

## Solución de Problemas

### No puedo hacer login
- Verifica que Docker esté corriendo: `docker compose ps`
- Revisa logs del backend: `docker compose logs backend`
- Revisa logs de postgres: `docker compose logs postgres`

### Token expirado
- Los tokens expiran después de 60 minutos
- Vuelve a hacer login para obtener un nuevo token

### No se creó el usuario admin
- Verifica las variables de entorno en `.env`
- Revisa logs de postgres: `docker compose logs postgres`
- Intenta recrear la base de datos: `docker compose down -v && docker compose up -d`

### Error 403 Forbidden
- El endpoint requiere permisos de administrador
- Usa una cuenta admin o pide a un admin que te promueva

### Error 401 Unauthorized
- Token inválido o expirado
- Falta el header Authorization
- Usuario eliminado de la base de datos

## Archivos Creados

### Scripts de Base de Datos
- `init-scripts/03-create-users-table.sql`
- `init-scripts/04-create-initial-admin.sh`

### Backend
- `backend/models/user.py` - Modelos Pydantic
- `backend/auth/jwt.py` - Gestión JWT y bcrypt
- `backend/auth/dependencies.py` - Dependencies de FastAPI
- `backend/services/user_service.py` - Operaciones CRUD
- `backend/routers/users.py` - Endpoints de usuarios

### Documentación
- `backend/AUTH_README.md` - Documentación completa (inglés)
- `backend/IMPLEMENTATION_SUMMARY.md` - Resumen de implementación (inglés)
- `backend/GUIA_USUARIOS.md` - Esta guía (español)
- `backend/test_auth.sh` - Script de pruebas

## Archivos Modificados

- `backend/app.py` - Agregado router de usuarios
- `backend/routers/query.py` - Protegidos todos los endpoints
- `backend/config.py` - Agregados settings JWT
- `backend/requirements.txt` - Agregadas dependencias
- `.env.example` - Agregadas variables JWT y admin
- `docker-compose.yml` - Habilitado servicio backend

## Integración con Frontend

El frontend debe:

1. **Almacenar el token** después del login (localStorage/sessionStorage)
2. **Incluir el token** en todas las peticiones vía header Authorization
3. **Manejar 401** redirigiendo al login
4. **Manejar 403** mostrando "acceso denegado"
5. **Renovar o re-login** cuando el token expire

## Comandos Útiles

```bash
# Ver todos los servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar backend
docker compose restart backend

# Limpiar todo y empezar de cero
docker compose down -v
docker compose up -d

# Ejecutar pruebas
cd backend && bash test_auth.sh

# Desarrollo local con conda
conda activate ainomics
cd backend
uvicorn app:app --reload
```

## ¿Necesitas Ayuda?

Revisa la documentación completa en:
- `backend/AUTH_README.md` - Documentación técnica detallada
- `backend/IMPLEMENTATION_SUMMARY.md` - Resumen de implementación

¡Todo listo para usar! 🚀
