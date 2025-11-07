# API Configuration

## Setup

1. **Configure API URL**: Edit `src/config/env.ts` and change the `API_URL` to your backend server URL.

```typescript
export const ENV_CONFIG = {
  API_URL: 'http://your-backend-url:port' // Change this
};
```

2. **Backend Endpoint**: The frontend expects the backend to have a POST endpoint at `/api/v1/invoke`

3. **Request Format**: 
```json
{
  "message": "user question here"
}
```

4. **Response Format**:
```json
{
  "input": "user question",
  "schema_context": "database schema info",
  "plan": ["execution plan"],
  "response": "AI response content",
  "execution_successful": true
}
```

## Usage

- The frontend will now send real API calls to your backend instead of showing mock responses
- User messages are sent to the backend and real AI responses are displayed
- Error handling is included for failed API calls
