# AI Agent Backend

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python app.py
```

## API Endpoints

### POST /api/query
Standard query endpoint with JSON response

### POST /api/query/stream
Streaming query endpoint with SSE

### GET /api/session/{session_id}
Get session history

### DELETE /api/session/{session_id}
Clear session

## Structure

- `routers/` - API endpoints
- `core/` - Query routing and execution
- `tools/` - Tool implementations (sql, vector, analytics)
- `memory/` - Redis and Postgres memory management
- `utils/` - Utilities

## Adding New Tools

1. Create file in `tools/`
2. Inherit from `BaseTool`
3. Implement `execute()` method
4. Register in `core/executor.py`

