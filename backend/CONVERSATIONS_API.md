# API de Conversaciones - Documentación Frontend

## 📋 Resumen del Sistema

El sistema ahora incluye **conversaciones persistentes** que se guardan permanentemente en PostgreSQL. Los usuarios pueden:

- ✅ Crear nuevas conversaciones
- ✅ Continuar conversaciones existentes (incluso días después)
- ✅ Ver historial completo de todas sus conversaciones
- ✅ Renombrar conversaciones
- ✅ Eliminar conversaciones

---

## 🔄 Cambios Importantes en /api/query

### Antes vs Ahora

**ANTES:**
```javascript
// Crear sesión temporal (se pierde después de 45 minutos)
POST /api/query
{
  "query": "¿Cuánto vendimos?"
}

// Response
{
  "message": [...],
  "metadata": {
    "session_id": "user_123_1706745600"  // ID temporal
  }
}
```

**AHORA:**
```javascript
// Crear conversación permanente
POST /api/query
{
  "query": "¿Cuánto vendimos?"
}

// Response
{
  "message": [...],
  "metadata": {
    "conversation_id": "uuid-permanente"  // ID que persiste forever
  }
}

// Continuar conversación
POST /api/query
{
  "query": "¿Y en febrero?",
  "session_id": "uuid-permanente"  // Mismo conversation_id
}
```

---

## 🎯 Contexto del Agente: Solo 4 Mensajes

**El agente ahora usa solo los últimos 4 mensajes:**
- 2 últimos mensajes del usuario
- 2 últimas respuestas del asistente

Esto hace que el agente sea más eficiente pero mantiene contexto reciente para continuidad.

---

## 📡 Nuevos Endpoints

### Base URL
```
http://localhost:8000
```

---

## 📚 Endpoints de Conversaciones

### 1. Listar Conversaciones del Usuario

```http
GET /api/conversations?limit=50&offset=0&archived=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (opcional): Número máximo de conversaciones (default: 50)
- `offset` (opcional): Para paginación (default: 0)
- `archived` (opcional): Incluir conversaciones archivadas (default: false)

**Respuesta (200):**
```json
{
  "conversations": [
    {
      "conversation_id": "uuid-1",
      "title": "¿Cuánto vendimos en enero?",
      "created_at": "2026-02-01T10:00:00",
      "updated_at": "2026-02-01T10:15:00",
      "last_message_at": "2026-02-01T10:15:00",
      "message_count": 6,
      "last_user_message": "¿Y en febrero?",
      "archived": false,
      "metadata": {}
    },
    {
      "conversation_id": "uuid-2",
      "title": "Productos más vendidos del mes",
      "created_at": "2026-01-30T14:00:00",
      "updated_at": "2026-01-30T14:20:00",
      "last_message_at": "2026-01-30T14:20:00",
      "message_count": 4,
      "last_user_message": "Dame el top 10",
      "archived": false,
      "metadata": {}
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

**Ejemplo JavaScript:**
```javascript
async function loadConversations(limit = 50, offset = 0) {
  const response = await fetch(`/api/conversations?limit=${limit}&offset=${offset}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.conversations;
}
```

---

### 2. Obtener Conversación Completa con Mensajes

```http
GET /api/conversations/{conversation_id}
Authorization: Bearer <token>
```

**Path Parameters:**
- `conversation_id`: UUID de la conversación

**Respuesta (200):**
```json
{
  "conversation": {
    "conversation_id": "uuid",
    "user_id": "user-uuid",
    "title": "¿Cuánto vendimos en enero?",
    "created_at": "2026-02-01T10:00:00",
    "updated_at": "2026-02-01T10:15:00",
    "last_message_at": "2026-02-01T10:15:00",
    "archived": false,
    "metadata": {}
  },
  "messages": [
    {
      "message_id": "msg-uuid-1",
      "conversation_id": "uuid",
      "role": "user",
      "content": {
        "text": "¿Cuánto vendimos en enero?"
      },
      "metadata": {},
      "created_at": "2026-02-01T10:00:00"
    },
    {
      "message_id": "msg-uuid-2",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "data": "En enero vendimos $150,000 MXN"
        },
        {
          "type": "bar_chart",
          "data": {
            "labels": ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
            "datasets": [...]
          }
        }
      ],
      "metadata": {
        "query_type": "simple",
        "type": "simple_agent"
      },
      "created_at": "2026-02-01T10:00:05"
    },
    {
      "message_id": "msg-uuid-3",
      "conversation_id": "uuid",
      "role": "user",
      "content": {
        "text": "¿Y en febrero?"
      },
      "metadata": {},
      "created_at": "2026-02-01T10:15:00"
    },
    {
      "message_id": "msg-uuid-4",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "data": "En febrero vendimos $175,000 MXN, un 16.7% más que enero"
        }
      ],
      "metadata": {
        "query_type": "simple",
        "type": "simple_agent"
      },
      "created_at": "2026-02-01T10:15:03"
    }
  ],
  "message_count": 4
}
```

**Errores:**
- **404**: Conversación no encontrada o no pertenece al usuario

**Ejemplo JavaScript:**
```javascript
async function loadConversation(conversationId) {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Conversation not found');
    }
    throw new Error('Failed to load conversation');
  }
  
  return await response.json();
}
```

---

### 3. Actualizar Título de Conversación

```http
PUT /api/conversations/{conversation_id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Análisis de Ventas Q1 2026"
}
```

**Respuesta (200):**
```json
{
  "status": "updated",
  "conversation_id": "uuid"
}
```

**Errores:**
- **404**: Conversación no encontrada

**Ejemplo JavaScript:**
```javascript
async function renameConversation(conversationId, newTitle) {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: newTitle })
  });
  
  if (!response.ok) {
    throw new Error('Failed to rename conversation');
  }
  
  return await response.json();
}
```

---

### 4. Eliminar Conversación

```http
DELETE /api/conversations/{conversation_id}?permanent=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `permanent` (opcional): 
  - `false` (default): Archivar (soft delete) - se puede recuperar
  - `true`: Eliminar permanentemente - NO se puede recuperar

**Respuesta (200):**
```json
{
  "status": "archived",  // o "deleted" si permanent=true
  "conversation_id": "uuid",
  "permanent": false
}
```

**Errores:**
- **404**: Conversación no encontrada

**Ejemplo JavaScript:**
```javascript
async function deleteConversation(conversationId, permanent = false) {
  const response = await fetch(
    `/api/conversations/${conversationId}?permanent=${permanent}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }
  
  return await response.json();
}
```

---

### 5. Obtener Solo Mensajes (con paginación)

```http
GET /api/conversations/{conversation_id}/messages?limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (opcional): Número máximo de mensajes (default: todos)
- `offset` (opcional): Para paginación (default: 0)

**Respuesta (200):**
```json
{
  "conversation_id": "uuid",
  "messages": [...],
  "count": 20
}
```

---

## 💬 Endpoint de Query (Modificado)

### Crear o Continuar Conversación

```http
POST /api/query
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "query": "¿Cuánto vendimos?",
  "session_id": "uuid-opcional"  // Si no se envía, crea nueva conversación
}
```

**Respuesta (200):**
```json
{
  "message": [
    {
      "type": "text",
      "data": "Vendimos $150,000 MXN"
    }
  ],
  "metadata": {
    "conversation_id": "uuid",  // ⚠️ CAMBIÓ de session_id a conversation_id
    "query_type": "simple",
    "latency_ms": 1234.56,
    "type": "simple_agent"
  }
}
```

**Errores:**
- **404**: `session_id` proporcionado no existe o no pertenece al usuario
- **401**: Token inválido o expirado

---

## 🎨 Ejemplos de Implementación Frontend

### Servicio de Conversaciones

```javascript
// services/conversationService.js
import apiClient from './apiClient';

class ConversationService {
  /**
   * List user's conversations
   */
  async listConversations(limit = 50, offset = 0, archived = false) {
    const params = new URLSearchParams({ limit, offset, archived });
    return apiClient.get(`/api/conversations?${params}`);
  }
  
  /**
   * Get full conversation with all messages
   */
  async getConversation(conversationId) {
    return apiClient.get(`/api/conversations/${conversationId}`);
  }
  
  /**
   * Rename conversation
   */
  async renameConversation(conversationId, title) {
    return apiClient.put(`/api/conversations/${conversationId}`, { title });
  }
  
  /**
   * Delete conversation
   * @param {string} conversationId 
   * @param {boolean} permanent - If true, permanently delete. If false, archive.
   */
  async deleteConversation(conversationId, permanent = false) {
    return apiClient.delete(`/api/conversations/${conversationId}?permanent=${permanent}`);
  }
  
  /**
   * Get messages with pagination
   */
  async getMessages(conversationId, limit = null, offset = 0) {
    const params = new URLSearchParams({ offset });
    if (limit) params.append('limit', limit);
    return apiClient.get(`/api/conversations/${conversationId}/messages?${params}`);
  }
}

export default new ConversationService();
```

### Servicio de Query (Actualizado)

```javascript
// services/queryService.js
import apiClient from './apiClient';

class QueryService {
  /**
   * Send a query (creates new conversation or continues existing)
   * @param {string} query - The user's question
   * @param {string|null} conversationId - Conversation ID to continue (optional)
   */
  async query(query, conversationId = null) {
    const payload = { query };
    
    if (conversationId) {
      payload.session_id = conversationId;  // Continue existing conversation
    }
    
    return apiClient.post('/api/query', payload);
  }
  
  /**
   * Send query with streaming response
   */
  async queryStream(query, conversationId = null, onChunk) {
    const token = authService.getToken();
    const payload = { query };
    
    if (conversationId) {
      payload.session_id = conversationId;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Stream query failed');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onChunk(data);
        }
      }
    }
  }
}

export default new QueryService();
```

---

## 🖥️ Componentes React de Ejemplo

### Lista de Conversaciones

```jsx
// components/ConversationList.jsx
import { useState, useEffect } from 'react';
import conversationService from '../services/conversationService';

export default function ConversationList({ onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  const loadConversations = async () => {
    try {
      const data = await conversationService.listConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (conversationId, e) => {
    e.stopPropagation();
    
    if (!confirm('¿Eliminar esta conversación?')) return;
    
    try {
      await conversationService.deleteConversation(conversationId, false); // Archive
      loadConversations(); // Reload list
    } catch (error) {
      alert('Error al eliminar conversación');
    }
  };
  
  const handleRename = async (conversationId, e) => {
    e.stopPropagation();
    
    const newTitle = prompt('Nuevo título:');
    if (!newTitle) return;
    
    try {
      await conversationService.renameConversation(conversationId, newTitle);
      loadConversations(); // Reload list
    } catch (error) {
      alert('Error al renombrar conversación');
    }
  };
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div className="conversation-list">
      <h2>Tus Conversaciones</h2>
      {conversations.length === 0 ? (
        <p>No tienes conversaciones aún. ¡Haz tu primera pregunta!</p>
      ) : (
        <ul>
          {conversations.map(conv => (
            <li 
              key={conv.conversation_id}
              onClick={() => onSelectConversation(conv.conversation_id)}
              className="conversation-item"
            >
              <div className="conversation-header">
                <h3>{conv.title}</h3>
                <span className="message-count">{conv.message_count} mensajes</span>
              </div>
              <p className="last-message">{conv.last_user_message}</p>
              <div className="conversation-meta">
                <span>{new Date(conv.last_message_at).toLocaleDateString()}</span>
                <div className="actions">
                  <button onClick={(e) => handleRename(conv.conversation_id, e)}>
                    Renombrar
                  </button>
                  <button onClick={(e) => handleDelete(conv.conversation_id, e)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Vista de Conversación

```jsx
// components/ConversationView.jsx
import { useState, useEffect } from 'react';
import conversationService from '../services/conversationService';
import queryService from '../services/queryService';

export default function ConversationView({ conversationId, onBack }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);
  
  const loadConversation = async () => {
    try {
      const data = await conversationService.getConversation(conversationId);
      setConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert('Error al cargar conversación');
      onBack();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    
    try {
      // Send query with conversation ID
      const response = await queryService.query(query, conversationId);
      
      // Add user message to UI
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: { text: query },
          created_at: new Date().toISOString()
        }
      ]);
      
      // Add assistant response to UI
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.message,
          metadata: response.metadata,
          created_at: new Date().toISOString()
        }
      ]);
      
      setQuery('');
    } catch (error) {
      alert('Error al enviar query');
    } finally {
      setLoading(false);
    }
  };
  
  if (!conversation) return <div>Cargando...</div>;
  
  return (
    <div className="conversation-view">
      <header>
        <button onClick={onBack}>← Volver</button>
        <h2>{conversation.title}</h2>
      </header>
      
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.role === 'user' ? (
              <p>{msg.content.text}</p>
            ) : (
              <div>
                {msg.content.map((component, i) => (
                  <div key={i}>
                    {component.type === 'text' && <p>{component.data}</p>}
                    {component.type === 'bar_chart' && <BarChart data={component.data} />}
                    {/* Render other component types */}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="query-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Continúa la conversación..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
```

### Aplicación Principal

```jsx
// App.jsx
import { useState } from 'react';
import ConversationList from './components/ConversationList';
import ConversationView from './components/ConversationView';
import NewQueryPanel from './components/NewQueryPanel';

export default function App() {
  const [view, setView] = useState('list'); // 'list', 'conversation', 'new'
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  
  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    setView('conversation');
  };
  
  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setView('new');
  };
  
  const handleConversationCreated = (conversationId) => {
    setSelectedConversationId(conversationId);
    setView('conversation');
  };
  
  const handleBack = () => {
    setView('list');
    setSelectedConversationId(null);
  };
  
  return (
    <div className="app">
      {view === 'list' && (
        <>
          <button onClick={handleNewConversation}>Nueva Conversación</button>
          <ConversationList onSelectConversation={handleSelectConversation} />
        </>
      )}
      
      {view === 'conversation' && (
        <ConversationView 
          conversationId={selectedConversationId}
          onBack={handleBack}
        />
      )}
      
      {view === 'new' && (
        <NewQueryPanel 
          onConversationCreated={handleConversationCreated}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Nueva Conversación

```
1. Usuario hace clic en "Nueva Conversación"
2. Usuario escribe primera pregunta
3. Frontend → POST /api/query (sin session_id)
4. Backend crea conversación en PostgreSQL
5. Backend devuelve respuesta + conversation_id
6. Frontend guarda conversation_id para siguientes queries
```

### Flujo 2: Continuar Conversación

```
1. Usuario selecciona conversación de la lista
2. Frontend → GET /api/conversations/{id}
3. Frontend muestra historial completo
4. Usuario escribe nueva pregunta
5. Frontend → POST /api/query (con session_id = conversation_id)
6. Backend recarga contexto de PostgreSQL si Redis expiró
7. Backend devuelve respuesta
8. Frontend agrega mensaje a la vista
```

### Flujo 3: Retomar Conversación Antigua

```
1. Usuario abre conversación de hace 5 días
2. Frontend carga TODOS los mensajes desde PostgreSQL
3. Usuario ve historial completo (no se pierde nada)
4. Usuario hace nueva query
5. Backend detecta que Redis expiró
6. Backend recarga últimos 4 mensajes a Redis
7. Agente procesa con contexto reciente
8. Conversación continúa normalmente
```

---

## 📊 Estructura de Datos

### Conversation Object
```typescript
interface Conversation {
  conversation_id: string;        // UUID
  user_id: string;               // UUID del dueño
  title: string;                 // Auto-generado o editado
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  last_message_at: string;       // ISO timestamp
  archived: boolean;             // false = activa, true = archivada
  metadata: object;              // Metadata adicional
  message_count?: number;        // Solo en lista
  last_user_message?: string;    // Solo en lista
}
```

### Message Object
```typescript
interface Message {
  message_id: string;            // UUID
  conversation_id: string;       // UUID
  role: 'user' | 'assistant';
  content: UserContent | AssistantContent;
  metadata: object;
  created_at: string;            // ISO timestamp
}

interface UserContent {
  text: string;
}

interface AssistantContent {
  type: 'text' | 'bar_chart' | 'pie_chart' | ...;
  data: any;
}[]
```

---

## ✅ Checklist de Integración

### Backend Setup
- [ ] Ejecutar `init-scripts/05-create-conversations-tables.sql` en PostgreSQL
- [ ] Verificar que `conversation_service.py` esté en `services/`
- [ ] Verificar que `conversations.py` router esté registrado en `app.py`
- [ ] Reiniciar backend

### Frontend Implementation
- [ ] Crear `conversationService.js`
- [ ] Actualizar `queryService.js` (cambiar `session_id` a `conversation_id`)
- [ ] Crear componente `ConversationList`
- [ ] Crear componente `ConversationView`
- [ ] Implementar navegación entre vistas
- [ ] Probar flujo completo

### Testing
- [ ] Crear nueva conversación
- [ ] Continuar conversación existente
- [ ] Renombrar conversación
- [ ] Eliminar conversación
- [ ] Retomar conversación después de días

---

## 🆘 Troubleshooting

### Error: "Conversation not found"
**Causa:** `session_id` inválido o conversación eliminada
**Solución:** Verificar que el ID sea correcto, o crear nueva conversación

### Error: Backend no guarda mensajes
**Causa:** Tablas no creadas en PostgreSQL
**Solución:** Ejecutar `05-create-conversations-tables.sql`

### Conversación no muestra historial antiguo
**Causa:** Intentando leer solo de Redis
**Solución:** Usar endpoint `/api/conversations/{id}` para cargar desde PostgreSQL

---

## 📚 Recursos Adicionales

- **Documentación de Autenticación**: `backend/FRONTEND_AUTH_API.md`
- **Scripts SQL**: `init-scripts/05-create-conversations-tables.sql`
- **Servicios Backend**: `backend/services/conversation_service.py`
- **Router Backend**: `backend/routers/conversations.py`

---

¡El sistema de conversaciones está listo para usar! 🚀
