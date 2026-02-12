# Backend 500 Error Analysis - Login Endpoint

## Problem
The login endpoint (`POST /api/auth/login`) is returning a 500 Internal Server Error instead of proper error handling.

## Root Cause
The login endpoint in `backend/routers/users.py` doesn't have try-catch error handling. If any of these operations fail, it causes a 500 error:

1. **Database Connection Failure** - `get_user_by_email()` tries to connect to PostgreSQL
2. **Database Query Error** - SQL query fails (table missing, wrong schema, etc.)
3. **Password Verification Error** - `verify_password()` fails unexpectedly
4. **Token Creation Error** - `create_access_token()` fails

## Current Code (No Error Handling)
```python
@router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    # Get user by email - NO ERROR HANDLING
    user = await get_user_by_email(login_data.email)  # ← Can fail here
    
    if user is None:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Verify password - NO ERROR HANDLING
    if not verify_password(login_data.password, user.password_hash):  # ← Can fail here
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create token - NO ERROR HANDLING
    access_token = create_access_token(data={"sub": str(user.user_id)})  # ← Can fail here
    
    # ... rest of code
```

## Most Likely Causes

### 1. Database Connection Issue (Most Common)
**Symptom:** Backend can't connect to PostgreSQL
**Error:** `asyncpg.exceptions.InvalidPasswordError` or `asyncpg.exceptions.ConnectionDoesNotExistError`

**Check:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database connection settings
cat backend/.env
# Should have:
# POSTGRES_HOST=localhost (or postgres if using Docker)
# POSTGRES_PORT=5432
# POSTGRES_DB=your_database
# POSTGRES_USER=your_user
# POSTGRES_PASSWORD=your_password
```

**Fix:**
- Start PostgreSQL: `docker-compose up -d postgres`
- Check database credentials in `backend/config.py`
- Verify database exists: `psql -U your_user -d your_database`

### 2. Database Table Missing
**Symptom:** `users` table doesn't exist
**Error:** `asyncpg.exceptions.UndefinedTableError: relation "users" does not exist`

**Check:**
```bash
# Connect to database
psql -U your_user -d your_database

# Check if users table exists
\dt users
```

**Fix:**
- Run database migrations
- Check `backend/models/user.py` for table schema
- Create table manually if needed

### 3. Missing Environment Variables
**Symptom:** Database connection settings are None/empty
**Error:** `TypeError: argument of type 'NoneType' is not iterable`

**Check:**
```bash
# Check backend config
cat backend/config.py
# Should load from environment variables
```

**Fix:**
- Create `.env` file in `backend/` directory
- Set all required database variables

## How to Debug

### 1. Check Backend Logs
```bash
# If using Docker
docker-compose logs backend | tail -50

# If running directly
# Check the terminal where backend is running
# Look for Python traceback errors
```

### 2. Test Database Connection
```bash
# Test PostgreSQL connection
psql -h localhost -U your_user -d your_database

# If connection fails, check:
# - Is PostgreSQL running?
# - Are credentials correct?
# - Is database created?
```

### 3. Test Login Endpoint Directly
```bash
# Test with curl
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vorta.com","password":"admin123"}' \
  -v

# Check response status and error message
```

## Recommended Fix

Add error handling to the login endpoint:

```python
@router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    try:
        # Get user by email
        user = await get_user_by_email(login_data.email)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.user_id)})
        
        # Convert to response
        user_response = UserResponse(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            last_name=user.last_name,
            admin=user.admin,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response,
        )
    except asyncpg.exceptions.PostgresError as e:
        # Database errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        # Any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
```

## Quick Fixes to Try

1. **Restart Backend:**
   ```bash
   docker-compose restart backend
   ```

2. **Check Database:**
   ```bash
   docker-compose ps postgres
   docker-compose logs postgres
   ```

3. **Verify Environment Variables:**
   ```bash
   cd backend
   cat .env
   # Or check config.py for defaults
   ```

4. **Check Backend Logs:**
   ```bash
   docker-compose logs backend | grep -i error
   ```

## Next Steps

1. **Check backend logs** - This will show the exact error
2. **Verify database is running** - Most common issue
3. **Check database credentials** - Wrong password/host causes connection failures
4. **Verify users table exists** - Table might not be created

The actual error message in the backend logs will tell you exactly what's wrong!
