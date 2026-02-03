# Authentication Setup Guide

## Overview

The frontend requires JWT authentication to access the backend API. The `/api/query` endpoint (documented in `FRONTEND_API_DOCS.md`) requires a valid JWT token in the `Authorization: Bearer <token>` header.

## Authentication Flow

### 1. Login Endpoint
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "user_id": "user_123",
      "email": "user@example.com",
      "name": "John",
      "last_name": "Doe",
      "admin": false
    }
  }
  ```
- **Error Responses**:
  - `401`: Invalid credentials
  - `404`: Endpoint not found (backend may not have auth set up yet)
  - `500`: Server error

### 2. Query Endpoint (Requires Authentication)
- **URL**: `/api/query`
- **Method**: `POST`
- **Headers**: 
  ```
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "query": "What are total sales?",
    "session_id": "session_123" // optional
  }
  ```
- **Note**: `user_id` is **NOT** sent in the body - it's extracted from the JWT token by the backend

### 3. Response Format
The `/api/query` endpoint returns structured responses as documented in `FRONTEND_API_DOCS.md`:
```json
{
  "message": [
    {
      "type": "text",
      "data": "Markdown formatted string"
    },
    {
      "type": "bar_chart",
      "data": { ... }
    }
  ],
  "metadata": {
    "session_id": "string",
    "query_type": "simple" | "dynamic",
    "latency_ms": number,
    "type": "simple_agent" | "dynamic"
  }
}
```

## Common Issues

### Issue 1: "Failed to fetch" Error on Login

**Cause**: The login endpoint (`/api/auth/login`) doesn't exist or is unreachable.

**Solutions**:
1. **Check if backend has auth endpoints**: Verify with backend team if `/api/auth/login` exists
2. **Use dev token (temporary)**: If auth endpoints don't exist yet, set a dev token manually:
   ```javascript
   // In browser console (F12)
   localStorage.setItem('dev_token', 'your-jwt-token-here');
   ```
3. **Check network connectivity**: Ensure backend at `https://ladonaapi.ainomics.online` is accessible

### Issue 2: "Not authenticated" (403) Error on Queries

**Cause**: No valid JWT token is being sent with API requests.

**Solutions**:
1. **Login first**: Use the login page to get a valid token
2. **Check token storage**: Verify token exists:
   ```javascript
   // In browser console
   console.log('JWT Token:', localStorage.getItem('jwt_token'));
   console.log('Dev Token:', localStorage.getItem('dev_token'));
   ```
3. **Set dev token**: If login endpoint doesn't exist, set a dev token:
   ```javascript
   localStorage.setItem('dev_token', 'your-jwt-token-here');
   ```

### Issue 3: Token Not Persisting

**Cause**: Token is cleared or not being stored correctly.

**Check**:
- Token is stored in `localStorage` as `jwt_token`
- Dev token fallback is in `localStorage` as `dev_token`
- `sessionStorage` has `isLoggedIn: "true"`

## Current Implementation Status

- ✅ Frontend login page (`/user-id-entry`) implemented
- ✅ JWT token storage and retrieval
- ✅ `getAuthHeaders()` function adds `Authorization: Bearer <token>` to all API requests
- ✅ `/api/query` endpoint uses authentication headers
- ✅ Error handling for 403/401 responses
- ⚠️ Login endpoint may not exist on backend (404 errors)
- ⚠️ Backend may require authentication but endpoints not set up

## Development Workflow

### If Backend Has Auth Endpoints:
1. User enters email/password on login page
2. Frontend calls `/api/auth/login`
3. Backend returns JWT token
4. Frontend stores token in `localStorage` as `jwt_token`
5. All subsequent API calls include `Authorization: Bearer <token>` header
6. Backend extracts `user_id` from JWT token automatically

### If Backend Doesn't Have Auth Endpoints Yet:
1. Get a valid JWT token from backend admin
2. Set it manually in browser console:
   ```javascript
   localStorage.setItem('dev_token', 'your-token-here');
   ```
3. Frontend will use `dev_token` as fallback when `jwt_token` is not available
4. All API calls will include the dev token in headers

## How to Use the Login Page

### Step-by-Step Instructions:

1. **Navigate to Login Page**:
   - Go to: `http://localhost:5173/user-id-entry` (local) or your deployed URL
   - You should see the Aragon login page with email and password fields

2. **Enter Credentials**:
   - Enter your email address in the "Username or Email" field
   - Click "Continue" button
   - Enter your password in the password field that appears
   - Click "Login" button

3. **What Happens**:
   - Frontend sends POST request to: `https://ladonaapi.ainomics.online/api/auth/login`
   - Backend validates credentials and returns JWT token
   - Token is automatically stored in `localStorage` as `jwt_token`
   - You're redirected to the chat page (`/llm-chat`)

4. **Verify Login Success**:
   - Open browser DevTools (F12) → Console tab
   - Run:
     ```javascript
     console.log('Token:', localStorage.getItem('jwt_token'));
     console.log('User ID:', localStorage.getItem('userId'));
     console.log('Email:', localStorage.getItem('userEmail'));
     ```
   - You should see your token and user information

5. **Test a Query**:
   - After login, ask a question in the chat
   - The token is automatically included in all API requests
   - Check Network tab to see `Authorization: Bearer <token>` header

### Troubleshooting Login:

**"Failed to fetch" Error**:
- **This means the endpoint doesn't exist or isn't reachable** - NOT a credentials issue
- The `/api/auth/login` endpoint at `https://ladonaapi.ainomics.online/api/auth/login` may not be set up yet
- **Solution**: Use a dev token instead (see below)
- To verify: Open Network tab in DevTools → Look for the failed request → Check the exact error

**"Authentication failed" (401)**:
- Invalid email or password
- Check your credentials with backend admin

**404 Error**:
- Auth endpoint doesn't exist yet
- Use dev token method instead (see below)

## Testing Authentication

### Check if token is being sent:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a query in the chat
4. Check the `/api/query` request
5. Look for `Authorization: Bearer <token>` in Request Headers

### Verify token format:
- Should be a JWT string starting with `eyJ...`
- Can be decoded at https://jwt.io to see payload
- Should contain `user_id` in the payload

## Quick Fix: Use Dev Token (When Login Endpoint Doesn't Exist)

If you're getting "Failed to fetch" error, the login endpoint doesn't exist yet. Use this workaround:

### Step 1: Get a JWT Token from Backend Admin
Ask your backend administrator for a valid JWT token, or generate one if you have backend access.

### Step 2: Set Dev Token in Browser
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
   ```javascript
   localStorage.setItem('dev_token', 'your-jwt-token-here');
   localStorage.setItem('userId', 'your-user-id');
   localStorage.setItem('userEmail', 'your-email@example.com');
   sessionStorage.setItem('isLoggedIn', 'true');
   ```
4. Refresh the page
5. You should now be able to use the chat without logging in

### Step 3: Verify It Works
- Try asking a question in the chat
- Check Network tab → `/api/query` request → Headers
- You should see: `Authorization: Bearer <your-token>`

## Next Steps

1. **Verify backend auth endpoints exist**: Check if `/api/auth/login` and `/api/auth/signup` are available
2. **Test login flow**: Try logging in with valid credentials (if endpoints exist)
3. **Test query with token**: After login or setting dev token, make a query and verify it works
4. **If endpoints don't exist**: Use dev token method above until backend implements auth endpoints
