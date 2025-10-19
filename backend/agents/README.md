# AI Agents

Este directorio contiene los agentes de IA para el sistema.

## Arquitectura Simplificada (2 Tipos)

### 1. **SIMPLE Queries**
Consultas directas con SQL predefinido (manejadas en `core/executor.py`)
- Ejemplos: "¿Cuánto inventario tengo de X?", "¿Cuáles son las ventas?"
- **No usa LangGraph** - SQL hardcoded para máxima velocidad
- Fallback automático a DYNAMIC si no hay patrón predefinido

### 2. **DYNAMIC Queries** 
Todo lo demás (manejado por `DynamicAgent`)
- Ejemplos: Analytics, comparaciones, agregaciones, predicciones
- **Usa LangGraph** con ReAct pattern
- Retry automático en errores
- Escalable y fácil de extender

---

## DynamicAgent (`dynamic_agent.py`)

Agente principal para queries dinámicas usando LangGraph.

**Características:**
- ✅ ReAct pattern (Reasoning + Acting)
- ✅ Retry automático en errores de SQL
- ✅ System prompt anti-alucinaciones
- ✅ Logging detallado
- ✅ Fácilmente escalable

**Uso:**
```python
agent = DynamicAgent()
result = await agent.execute(
    query="¿Cuál es el backorder de este año?",
    session_id="session_123"
)
```

---

## Tools (`tools/`)

Herramientas disponibles para el agente. **Muy fácil de extender.**

### Tools Actuales:

#### 1. `sql_tool.py` - Consultas SQL
```python
@tool
async def query_database(sql: str, explanation: str) -> Dict:
    """Ejecuta SQL en client_data database"""
```

#### 2. `vector_tool.py` - Búsquedas Vectoriales
```python
@tool
async def vector_search(search_query: str, category: str) -> Dict:
    """Búsqueda semántica en main_db"""
```

### ¿Cómo agregar una nueva tool?

**Paso 1:** Crea `agents/tools/mi_nueva_tool.py`
```python
from langchain_core.tools import tool
from typing import Dict, Any, List

def create_mi_tool(queries_executed_ref: List[Dict]) -> tool:
    @tool
    async def mi_herramienta(param1: str, param2: int) -> Dict[str, Any]:
        """Descripción de qué hace la tool"""
        
        print(f"\n[TOOL: mi_herramienta] Ejecutando...")
        
        # Tu lógica aquí
        result = hacer_algo(param1, param2)
        
        # Log la ejecución
        queries_executed_ref.append({
            "type": "mi_tool",
            "params": {"param1": param1, "param2": param2},
            "source": "dynamic_agent",
            "success": True
        })
        
        return result
    
    return mi_herramienta
```

**Paso 2:** Agrégala en `dynamic_agent.py`
```python
def _load_tools(self):
    from agents.tools.sql_tool import create_sql_tool
    from agents.tools.vector_tool import create_vector_tool
    from agents.tools.mi_nueva_tool import create_mi_tool  # ← Nuevo
    
    self.tools.append(create_sql_tool(self.queries_executed))
    self.tools.append(create_vector_tool(self.queries_executed))
    self.tools.append(create_mi_tool(self.queries_executed))  # ← Nuevo
```

**¡Listo!** El agente ahora puede usar tu nueva tool.

---

## Ejemplos de Tools Futuras

```python
# Predicciones
create_prediction_tool()

# APIs externas (clima, competencia, etc)
create_weather_api_tool()
create_market_data_tool()

# Analytics avanzado
create_analytics_tool()
create_recommendation_tool()

# Procesamiento de imágenes
create_image_analysis_tool()

# Notificaciones
create_notification_tool()
```

---

## Flujo Completo

```
User Query
  ↓
Router classifica: SIMPLE o DYNAMIC
  ↓
┌─────────────┬──────────────┐
│   SIMPLE    │   DYNAMIC    │
│  (rápido)   │  (LangGraph) │
├─────────────┼──────────────┤
│ SQL         │ Agent loop   │
│ predefinido │ con tools    │
│ + LLM para  │ y retry      │
│ respuesta   │ automático   │
│ natural     │              │
└─────────────┴──────────────┘
  ↓
Response con queries_executed
```

---

## Debugging

Los logs muestran todo el flujo:

```
[DYNAMIC AGENT] Starting execution
[TOOL: query_database]
SQL: SELECT SUM(backorder_qty)...
Explanation: Get backorder for current year
✅ SQL Success: 5 rows returned
[DYNAMIC AGENT] Execution completed
Total tools used: 2
```

---

## Performance

- **SIMPLE**: ~1-2 segundos
- **DYNAMIC**: ~5-15 segundos (depende de reintentos)

