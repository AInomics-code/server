# User Authentication Module Documentation

## Overview

This document describes the user authentication and management system implemented in the Vorta backend.

## Features

- **JWT-based Authentication**: Stateless authentication using JSON Web Tokens
- **Password Security**: Passwords hashed with bcrypt (cost factor 12)
- **Role-based Access Control**: Admin users can manage other users
- **Auto-initialization**: Creates initial admin user on first Docker startup
- **Protected Endpoints**: All API endpoints require authentication

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Initial Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables for authentication:

```env
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-min-32-characters-please-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Initial Admin User (created on first startup)
INITIAL_ADMIN_EMAIL=admin@vorta.com
INITIAL_ADMIN_PASSWORD=admin123
INITIAL_ADMIN_NAME=Admin
INITIAL_ADMIN_LAST_NAME=User
```

### 2. Start Services with Docker Compose

```bash
docker compose up -d
```

The initial admin user will be created automatically on first startup.

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@vorta.com",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid",
    "email": "admin@vorta.com",
    "name": "Admin",
    "last_name": "User",
    "admin": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### User Management (Admin Only)

#### Create User
```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John",
  "last_name": "Doe",
  "admin": false
}
```

#### List All Users
```http
GET /api/users
Authorization: Bearer <admin-token>
```

#### Get User by ID
```http
GET /api/users/{user_id}
Authorization: Bearer <admin-token>
```

#### Update User
```http
PUT /api/users/{user_id}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jane",
  "email": "newemail@example.com",
  "password": "newpassword123",
  "admin": true
}
```

All fields are optional in the update request.

#### Delete User
```http
DELETE /api/users/{user_id}
Authorization: Bearer <admin-token>
```

### Query Endpoints (Authentication Required)

All existing query endpoints now require authentication:

```http
POST /api/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What is the total sales?",
  "session_id": "optional-session-id"
}
```

## Using with Conda Environment

For local development with conda:

```bash
# Activate conda environment
conda activate ainomics

# Install dependencies
cd /Users/jeff/Documents/vorta/server/backend
pip install -r requirements.txt

# Run the backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Testing Authentication

### 1. Login and Get Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vorta.com",
    "password": "admin123"
  }'
```

Save the `access_token` from the response.

### 2. Use Token for Authenticated Requests

```bash
# Get current user info
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <your-token>"

# Create a new user (admin only)
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New",
    "last_name": "User",
    "admin": false
  }'

# Make a query
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me the sales data"
  }'
```

## Security Considerations

1. **Change Default Credentials**: Always change the initial admin credentials in production
2. **Secure JWT Secret**: Use a strong, random secret key (32+ characters)
3. **HTTPS Only**: In production, use HTTPS to protect tokens in transit
4. **Token Expiration**: Tokens expire after 60 minutes by default (configurable)
5. **Password Requirements**: Minimum 8 characters (enforced by Pydantic validation)

## Architecture

### Components

- **Models** (`models/user.py`): Pydantic schemas for validation
- **Auth** (`auth/jwt.py`): JWT token creation and verification
- **Auth Dependencies** (`auth/dependencies.py`): FastAPI dependencies for authentication
- **Services** (`services/user_service.py`): Database operations for users
- **Routers** (`routers/users.py`): API endpoints for user management

### Authentication Flow

```
1. User sends credentials to /api/auth/login
2. Backend validates credentials against database
3. Backend generates JWT token with user_id
4. Client stores token and includes it in subsequent requests
5. Backend validates token on each request
6. Backend fetches user from database and injects into endpoint
```

## Troubleshooting

### "Invalid authentication credentials"
- Token expired (60 minutes default)
- Token invalid or malformed
- User deleted from database
- Solution: Login again to get a new token

### "Admin privileges required"
- Endpoint requires admin user
- Current user is not an admin
- Solution: Use an admin account or have an admin promote your user

### Initial admin user not created
- Check Docker logs: `docker compose logs postgres`
- Verify environment variables are set in `.env`
- Try recreating the database: `docker compose down -v && docker compose up -d`

### Password validation errors
- Passwords must be at least 8 characters
- Email must be valid format
- Email must be unique

## Frontend Integration

The frontend should:

1. **Store the token** after successful login (localStorage or sessionStorage)
2. **Include token in all requests** via Authorization header
3. **Handle 401 responses** by redirecting to login
4. **Handle 403 responses** by showing "access denied" message
5. **Refresh or re-login** when token expires

Example JavaScript:

```javascript
// Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('token', data.access_token);

// Authenticated request
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:8000/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ query: 'Show sales' })
});
```
