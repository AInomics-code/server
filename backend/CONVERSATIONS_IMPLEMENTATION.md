# Sistema de Conversaciones Persistentes - Resumen de Implementación

## 📋 Resumen

Se ha implementado un **sistema completo de conversaciones persistentes** que permite a los usuarios:

✅ Crear conversaciones que se guardan permanentemente en PostgreSQL  
✅ Continuar conversaciones existentes (incluso días después)  
✅ Ver historial completo de todas sus conversaciones  
✅ Renombrar y eliminar conversaciones  
✅ **Contexto del agente limitado a 4 mensajes** (2 user + 2 assistant)

---

## 🔧 Cambios Realizados

### 1. Base de Datos (PostgreSQL)

**Archivo:** `init-scripts/05-create-conversations-tables.sql`

- Tabla `conversations`: Almacena metadata de conversaciones
- Tabla `messages`: Almacena todos los mensajes
- Relación: Una conversación tiene muchos mensajes
- Soft delete: Conversaciones se archivan, no se eliminan
- Indexes optimizados para queries frecuentes

### 2. Servicios Backend

**Archivo:** `services/conversation_service.py`

Funciones implementadas:
- `create_conversation()` - Crear nueva conversación
- `list_conversations()` - Listar conversaciones del usuario
- `get_conversation()` - Obtener conversación con verificación de ownership
- `update_conversation_title()` - Renombrar conversación
- `archive_conversation()` - Archivar (soft delete)
- `delete_conversation()` - Eliminar permanentemente
- `add_message()` - Agregar mensaje a conversación
- `get_messages()` - Obtener mensajes con paginación
- **`get_recent_messages_for_context()`** - Obtener últimos 2 user + 2 assistant para el agente

### 3. Nuevos Endpoints API

**Archivo:** `routers/conversations.py`

- `GET /api/conversations` - Listar conversaciones
- `GET /api/conversations/{id}` - Obtener conversación completa
- `PUT /api/conversations/{id}` - Actualizar título
- `DELETE /api/conversations/{id}` - Eliminar (con opción permanent)
- `GET /api/conversations/{id}/messages` - Obtener solo mensajes

### 4. Endpoints Modificados

**Archivo:** `routers/query.py`

- **`POST /api/query`** ahora:
  - Crea conversación en PostgreSQL si no existe `session_id`
  - Verifica ownership de conversación existente
  - Recarga contexto de PostgreSQL a Redis si expiró
  - Guarda mensajes en PostgreSQL + Redis (doble escritura)
  - Devuelve `conversation_id` en lugar de `session_id`

- **`POST /api/query/stream`** actualizado con la misma lógica

### 5. Agentes Modificados

**Archivos:** `agents/simple_agent.py`, `agents/dynamic_agent.py`

**CAMBIO IMPORTANTE:** Contexto reducido de 10 mensajes a 4 mensajes

```python
# Antes: últimos 10 mensajes
recent_messages = conversation_history[-10:]

# Ahora: últimos 2 user + últimos 2 assistant (4 total)
user_messages = [msg for msg in conversation_history if msg.get("role") == "user"][-2:]
assistant_messages = [msg for msg in conversation_history if msg.get("role") == "assistant"][-2:]
```

### 6. Aplicación Principal

**Archivo:** `app.py`

- Registrado nuevo router `conversations`
- Importado `routers.conversations`

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                  POSTGRESQL (Permanente)                 │
│  conversations                    messages               │
│  ├─ conversation_id (PK)         ├─ message_id (PK)     │
│  ├─ user_id (FK)                 ├─ conversation_id (FK)│
│  ├─ title                        ├─ role                │
│  ├─ created_at                   ├─ content (JSONB)     │
│  ├─ last_message_at              ├─ metadata (JSONB)    │
│  └─ archived                     └─ created_at          │
└─────────────────────────────────────────────────────────┘
            ↕ (sincronización cuando Redis expira)
┌─────────────────────────────────────────────────────────┐
│              REDIS (Cache temporal - 48h)                │
│  session:{conv_id}:messages → últimos 20 mensajes       │
│  El agente siempre lee de aquí (performance)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### Nueva Conversación

```
1. Frontend: POST /api/query (sin session_id)
2. Backend: Crea conversación en PostgreSQL
3. Backend: Guarda mensaje user en PostgreSQL + Redis
4. Agente: Lee contexto de Redis (vacío, primera vez)
5. Agente: Genera respuesta
6. Backend: Guarda respuesta en PostgreSQL + Redis
7. Frontend: Recibe response con conversation_id
```

### Conversación Activa (Redis tiene cache)

```
1. Frontend: POST /api/query (con conversation_id)
2. Backend: Verifica ownership
3. Backend: Lee contexto de Redis ✅ (cache hit)
4. Backend: Guarda mensaje user en PostgreSQL + Redis
5. Agente: Lee últimos 4 mensajes de Redis
6. Agente: Genera respuesta con contexto
7. Backend: Guarda respuesta en PostgreSQL + Redis
8. Frontend: Recibe response
```

### Conversación Retomada (Redis expiró)

```
1. Frontend: GET /api/conversations/{id} (carga historial completo)
2. Usuario hace nueva query
3. Frontend: POST /api/query (con conversation_id)
4. Backend: Verifica Redis → ❌ vacío (expiró)
5. Backend: Carga últimos 4 mensajes de PostgreSQL
6. Backend: Recarga Redis con esos 4 mensajes
7. Backend: Guarda nuevo mensaje user en PostgreSQL + Redis
8. Agente: Lee contexto de Redis (recién recargado)
9. Agente: Genera respuesta
10. Backend: Guarda respuesta en PostgreSQL + Redis
11. Frontend: Recibe response
```

---

## 📝 Archivos Creados/Modificados

### Nuevos Archivos

```
init-scripts/
  └─ 05-create-conversations-tables.sql  [NUEVO]

backend/
  ├─ services/
  │   └─ conversation_service.py         [NUEVO]
  ├─ routers/
  │   └─ conversations.py                [NUEVO]
  └─ CONVERSATIONS_API.md                [NUEVO - Documentación frontend]
```

### Archivos Modificados

```
backend/
  ├─ app.py                              [MODIFICADO - Registra router conversations]
  ├─ routers/
  │   └─ query.py                        [MODIFICADO - Integra con PostgreSQL]
  ├─ agents/
  │   ├─ simple_agent.py                 [MODIFICADO - Contexto 4 mensajes]
  │   └─ dynamic_agent.py                [MODIFICADO - Contexto 4 mensajes]
  └─ config.py                           [YA MODIFICADO - extra="allow"]
```

---

## 🚀 Instrucciones de Deployment

### 1. Base de Datos

```bash
# En el servidor de producción, ejecutar:
docker compose exec postgres psql -U postgres -d main_db -f /tmp/setup-conversations.sql

# O copiar el archivo primero:
docker cp init-scripts/05-create-conversations-tables.sql server_dev-postgres-1:/tmp/setup-conversations.sql
docker compose exec postgres psql -U postgres -d main_db -f /tmp/setup-conversations.sql
```

### 2. Backend

```bash
# Reiniciar backend para cargar nuevos módulos
docker compose restart backend

# O si corriendo localmente:
# (en conda activate ainomics)
fastapi dev
```

### 3. Verificar

```bash
# Verificar que las tablas se crearon
docker compose exec postgres psql -U postgres -d main_db -c "\dt conversations"
docker compose exec postgres psql -U postgres -d main_db -c "\dt messages"

# Probar endpoint de conversaciones
curl -X GET http://localhost:8000/api/conversations \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing Manual

### Test 1: Crear Nueva Conversación

```bash
TOKEN="tu_token_aqui"

# Nueva query sin session_id
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"¿Cuánto vendimos en enero?"}'

# Response incluirá conversation_id
# Guardar ese ID para siguientes tests
```

### Test 2: Continuar Conversación

```bash
CONV_ID="uuid-de-test-1"

curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"¿Y en febrero?\",\"session_id\":\"$CONV_ID\"}"
```

### Test 3: Listar Conversaciones

```bash
curl -X GET http://localhost:8000/api/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### Test 4: Ver Conversación Completa

```bash
curl -X GET http://localhost:8000/api/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Test 5: Renombrar Conversación

```bash
curl -X PUT http://localhost:8000/api/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Análisis de Ventas Q1"}'
```

### Test 6: Eliminar Conversación

```bash
# Archivar (soft delete)
curl -X DELETE "http://localhost:8000/api/conversations/$CONV_ID?permanent=false" \
  -H "Authorization: Bearer $TOKEN"

# Eliminar permanentemente
curl -X DELETE "http://localhost:8000/api/conversations/$CONV_ID?permanent=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ Puntos Importantes

### 1. Contexto del Agente

- **Solo usa 4 mensajes** (2 user + 2 assistant más recientes)
- Frontend puede mostrar historial completo
- Agente solo procesa con contexto limitado
- Esto mejora performance y reduce costos de tokens

### 2. Redis vs PostgreSQL

- **Redis**: Cache temporal (48h), fuente de lectura para el agente
- **PostgreSQL**: Fuente de verdad permanente, historial completo
- Si Redis expira, se recarga automáticamente desde PostgreSQL
- Doble escritura: siempre guardar en ambos

### 3. Ownership Verification

- Todos los endpoints verifican que `conversation_id` pertenezca al `user_id`
- Retorna 404 si conversación no existe o no pertenece al usuario
- Security: usuarios no pueden ver conversaciones de otros

### 4. Títulos Auto-generados

- Primera query se usa como título (primeros 80 caracteres)
- Usuario puede renombrar después con PUT endpoint
- Títulos ayudan a identificar conversaciones en la lista

---

## 📊 Métricas y Monitoreo

### Queries a Monitorear

```sql
-- Total de conversaciones por usuario
SELECT user_id, COUNT(*) as total_conversations
FROM conversations
WHERE archived = FALSE
GROUP BY user_id;

-- Conversaciones más activas
SELECT conversation_id, title, COUNT(m.message_id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.conversation_id = m.conversation_id
GROUP BY c.conversation_id
ORDER BY message_count DESC
LIMIT 10;

-- Conversaciones sin actividad reciente
SELECT conversation_id, title, last_message_at
FROM conversations
WHERE archived = FALSE
  AND last_message_at < NOW() - INTERVAL '7 days'
ORDER BY last_message_at DESC;
```

---

## 🔮 Próximas Mejoras (Opcionales)

1. **Búsqueda de conversaciones**: Full-text search en títulos y mensajes
2. **Compartir conversaciones**: Entre usuarios del mismo equipo
3. **Export**: Exportar conversación completa como PDF/JSON
4. **Etiquetas**: Tags para organizar conversaciones
5. **Favoritos**: Marcar conversaciones importantes
6. **Estadísticas**: Dashboard de uso por usuario

---

## 📚 Documentación para Frontend

Ver archivo completo: **`backend/CONVERSATIONS_API.md`**

Incluye:
- Todos los endpoints con ejemplos
- Servicios JavaScript/TypeScript listos para usar
- Componentes React de ejemplo
- Flujos de usuario completos
- Troubleshooting

---

## ✅ Checklist Final

### Backend
- [x] Script SQL de tablas creado
- [x] Servicio `conversation_service.py` implementado
- [x] Router `conversations.py` implementado
- [x] Router `query.py` modificado para integración
- [x] Agentes modificados (contexto 4 mensajes)
- [x] Router registrado en `app.py`
- [x] Documentación completa creada

### Deployment
- [ ] Ejecutar script SQL en PostgreSQL producción
- [ ] Reiniciar backend en producción
- [ ] Verificar endpoints funcionando
- [ ] Probar flujo completo de conversaciones

### Frontend (Por hacer)
- [ ] Implementar `conversationService.js`
- [ ] Actualizar `queryService.js`
- [ ] Crear componentes de UI
- [ ] Integrar con autenticación existente
- [ ] Testing end-to-end

---

**Sistema de conversaciones listo para deployment! 🚀**
