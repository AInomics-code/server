# API de Conversaciones - Guía para Frontend Developer

## 🎯 Resumen Rápido

El sistema ahora tiene **conversaciones persistentes**. Los usuarios pueden crear conversaciones que se guardan permanentemente, verlas, continuarlas días después, renombrarlas y eliminarlas.

**Cambio importante:** El agente solo usa los **últimos 4 mensajes** (2 del usuario + 2 del asistente) para responder.

---

## 📡 Base URL

```
http://localhost:8000
```

---

## 🔐 Autenticación

Todos los endpoints requieren JWT token en el header:

```javascript
Authorization: Bearer <token>
```

---

## 📋 Endpoints

### 1. Listar Conversaciones

```http
GET /api/conversations?limit=50&offset=0
```

**Response:**
```json
{
  "conversations": [
    {
      "conversation_id": "uuid-1",
      "title": "¿Cuánto vendimos en enero?",
      "created_at": "2026-02-01T10:00:00",
      "last_message_at": "2026-02-01T10:15:00",
      "message_count": 6,
      "archived": false
    }
  ],
  "total": 1
}
```

---

### 2. Ver Conversación Completa

```http
GET /api/conversations/{conversation_id}
```

**Response:**
```json
{
  "conversation": {
    "conversation_id": "uuid",
    "title": "¿Cuánto vendimos en enero?",
    "created_at": "2026-02-01T10:00:00"
  },
  "messages": [
    {
      "message_id": "uuid",
      "role": "user",
      "content": {"text": "¿Cuánto vendimos?"},
      "created_at": "2026-02-01T10:00:00"
    },
    {
      "message_id": "uuid",
      "role": "assistant",
      "content": [
        {"type": "text", "data": "Vendimos $150,000"}
      ],
      "created_at": "2026-02-01T10:00:05"
    }
  ]
}
```

---

### 3. Nueva Conversación o Continuar

```http
POST /api/query
Content-Type: application/json
```

**Nueva conversación (NO enviar session_id):**
```json
{
  "query": "¿Cuánto vendimos?"
}
```

**Continuar conversación (enviar session_id):**
```json
{
  "query": "¿Y en febrero?",
  "session_id": "uuid-de-conversacion"
}
```

**Response:**
```json
{
  "message": [
    {"type": "text", "data": "Vendimos $150,000"}
  ],
  "metadata": {
    "conversation_id": "uuid",
    "query_type": "simple",
    "latency_ms": 1234
  }
}
```

---

### 4. Renombrar Conversación

```http
PUT /api/conversations/{conversation_id}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Análisis de Ventas Q1"
}
```

**Response:**
```json
{
  "status": "updated",
  "conversation_id": "uuid"
}
```

---

### 5. Eliminar Conversación

```http
DELETE /api/conversations/{conversation_id}?permanent=false
```

**Query params:**
- `permanent=false` → Archivar (se puede recuperar)
- `permanent=true` → Eliminar permanente (NO se puede recuperar)

**Response:**
```json
{
  "status": "archived",
  "conversation_id": "uuid",
  "permanent": false
}
```

---

## 💻 Código JavaScript

### Servicio de Conversaciones

```javascript
// services/conversationService.js
class ConversationService {
  constructor(apiClient) {
    this.api = apiClient;
  }
  
  // Listar conversaciones
  async list(limit = 50, offset = 0) {
    return this.api.get(`/api/conversations?limit=${limit}&offset=${offset}`);
  }
  
  // Ver conversación completa
  async get(conversationId) {
    return this.api.get(`/api/conversations/${conversationId}`);
  }
  
  // Renombrar
  async rename(conversationId, title) {
    return this.api.put(`/api/conversations/${conversationId}`, { title });
  }
  
  // Eliminar
  async delete(conversationId, permanent = false) {
    return this.api.delete(`/api/conversations/${conversationId}?permanent=${permanent}`);
  }
}

export default ConversationService;
```

---

### Servicio de Query (ACTUALIZADO)

```javascript
// services/queryService.js
class QueryService {
  constructor(apiClient) {
    this.api = apiClient;
  }
  
  // Enviar query
  async query(text, conversationId = null) {
    const body = { query: text };
    
    // Si hay conversationId, continuar conversación existente
    if (conversationId) {
      body.session_id = conversationId;
    }
    
    return this.api.post('/api/query', body);
  }
}

export default QueryService;
```

---

## 🎨 Ejemplos de UI

### Lista de Conversaciones

```javascript
const conversations = await conversationService.list();

conversations.forEach(conv => {
  console.log(`${conv.title} - ${conv.message_count} mensajes`);
});
```

### Ver Conversación

```javascript
const { conversation, messages } = await conversationService.get(conversationId);

// Mostrar título
console.log(conversation.title);

// Mostrar mensajes
messages.forEach(msg => {
  if (msg.role === 'user') {
    console.log(`Usuario: ${msg.content.text}`);
  } else {
    // Mensaje del asistente (puede tener múltiples componentes)
    msg.content.forEach(component => {
      if (component.type === 'text') {
        console.log(`Asistente: ${component.data}`);
      } else if (component.type === 'bar_chart') {
        // Renderizar gráfico
        renderChart(component.data);
      }
    });
  }
});
```

### Nueva Conversación

```javascript
// 1. Usuario escribe primera pregunta
const firstQuery = "¿Cuánto vendimos en enero?";

// 2. Enviar sin conversationId (crea nueva)
const response = await queryService.query(firstQuery, null);

// 3. Guardar conversation_id para siguientes queries
const conversationId = response.metadata.conversation_id;

// 4. Usuario hace segunda pregunta en la misma conversación
const secondQuery = "¿Y en febrero?";
const response2 = await queryService.query(secondQuery, conversationId);
```

### Continuar Conversación Existente

```javascript
// 1. Usuario selecciona conversación de la lista
const conversationId = "uuid-seleccionado";

// 2. Cargar conversación completa
const { messages } = await conversationService.get(conversationId);

// 3. Mostrar historial al usuario
displayMessages(messages);

// 4. Usuario hace nueva pregunta
const newQuery = "Dame los detalles";
const response = await queryService.query(newQuery, conversationId);

// 5. Agregar respuesta a la UI
appendMessage(response.message);
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Pantalla Inicial

```
1. Cargar lista de conversaciones: GET /api/conversations
2. Mostrar lista al usuario
3. Opciones:
   - Click en conversación → Ir a Flujo 2
   - Botón "Nueva conversación" → Ir a Flujo 3
```

### Flujo 2: Ver Conversación Existente

```
1. Usuario hace click en conversación
2. GET /api/conversations/{id}
3. Mostrar todo el historial de mensajes
4. Usuario escribe nueva pregunta
5. POST /api/query con session_id
6. Mostrar respuesta
7. Loop: Usuario puede seguir preguntando
```

### Flujo 3: Nueva Conversación

```
1. Usuario escribe primera pregunta
2. POST /api/query (SIN session_id)
3. Backend crea conversación automáticamente
4. Mostrar respuesta + guardar conversation_id
5. Usuario puede continuar en esta conversación
```

---

## ⚠️ Puntos Importantes

### Contexto del Agente

El agente solo usa **4 mensajes** para responder:
- 2 últimos mensajes del usuario
- 2 últimas respuestas del asistente

**Importante:** El frontend puede mostrar TODO el historial, pero el agente solo procesa los últimos 4 para generar respuestas.

### IDs de Conversación

- Antes: `session_id` temporal
- Ahora: `conversation_id` permanente (UUID)
- Usar `session_id` en POST /api/query para continuar
- Recibir `conversation_id` en response metadata

### Persistencia

- Las conversaciones se guardan **permanentemente** en PostgreSQL
- Puedes retomar una conversación días o semanas después
- El backend recarga el contexto automáticamente

---

## 🐛 Errores Comunes

### Error 404: "Conversation not found"

**Causa:** El `conversation_id` no existe o no pertenece al usuario

**Solución:** Verificar que el ID sea correcto

### Conversación sin historial

**Causa:** Intentando leer solo de Redis (cache)

**Solución:** Usar GET /api/conversations/{id} para cargar desde PostgreSQL

---

## 📊 Estructura de Datos

### Conversation
```typescript
{
  conversation_id: string;     // UUID
  user_id: string;            // UUID del dueño
  title: string;              // Título auto-generado o editado
  created_at: string;         // ISO timestamp
  updated_at: string;         // ISO timestamp
  last_message_at: string;    // ISO timestamp
  archived: boolean;          // false = activa
  message_count: number;      // Solo en lista
}
```

### Message
```typescript
{
  message_id: string;         // UUID
  conversation_id: string;    // UUID
  role: 'user' | 'assistant';
  content: UserContent | AssistantContent;
  metadata: object;
  created_at: string;         // ISO timestamp
}

// Usuario
interface UserContent {
  text: string;
}

// Asistente (array de componentes)
type AssistantContent = Array<{
  type: 'text' | 'bar_chart' | 'pie_chart' | ...;
  data: any;
}>;
```

---

## ✅ Checklist de Implementación

### Básico
- [ ] Crear `conversationService.js`
- [ ] Actualizar `queryService.js` (agregar `session_id`)
- [ ] Componente para listar conversaciones
- [ ] Componente para ver conversación
- [ ] Navegación entre vistas

### Funcionalidad Extra
- [ ] Botón "Nueva conversación"
- [ ] Botón "Renombrar" en cada conversación
- [ ] Botón "Eliminar" con confirmación
- [ ] Paginación en lista (si tienes muchas conversaciones)
- [ ] Indicador de "cargando" durante queries

### UI/UX
- [ ] Mostrar fecha de última actividad
- [ ] Mostrar contador de mensajes
- [ ] Highlight de conversación activa
- [ ] Scroll automático a último mensaje
- [ ] Placeholder cuando no hay conversaciones

---

## 🆘 Testing Rápido

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vorta.com","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Nueva conversación
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"¿Cuánto vendimos?"}'

# 3. Listar conversaciones
curl -X GET http://localhost:8000/api/conversations \
  -H "Authorization: Bearer $TOKEN"

# 4. Ver conversación (reemplaza UUID)
curl -X GET http://localhost:8000/api/conversations/UUID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Recursos

- **Documentación completa**: `backend/CONVERSATIONS_API.md` (incluye componentes React)
- **Autenticación**: `backend/FRONTEND_AUTH_API.md`
- **Testing**: Usa Postman o el script bash arriba

---

¿Dudas? Revisa `CONVERSATIONS_API.md` para ejemplos completos de componentes React.
