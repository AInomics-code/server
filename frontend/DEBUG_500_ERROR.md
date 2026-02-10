# Debugging 500 Error - Step-by-Step Guide

## Current Status
- ✅ Frontend is correctly configured
- ✅ Authentication is working (login stores token)
- ✅ API requests include Authorization header
- ❌ Backend returns 500 Internal Server Error

## Step 1: Verify Token is Stored

**In Browser Console (F12):**
```javascript
// Check if token exists
localStorage.getItem('jwt_token')

// Should return a long string like: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// If null, you need to login again
```

## Step 2: Check Request in Browser DevTools

1. Open **Network tab** (F12 → Network)
2. Send a question
3. Find the `/api/query` request
4. Check:
   - **Request Headers**: Should have `Authorization: Bearer <token>`
   - **Request Payload**: Should be `{"query": "...", "session_id": "..."}` (NO user_id)
   - **Response**: Check the error message

## Step 3: Check Backend Logs

**If using Docker:**
```bash
cd /Users/emilio/Downloads/server
docker-compose logs backend | tail -50
```

**If running directly:**
```bash
# Check the terminal where backend is running
# Look for Python traceback errors
```

## Step 4: Test Backend Directly

**Test with curl:**
```bash
# 1. Get token (login)
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vorta.com","password":"admin123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Test query endpoint
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"test question"}' \
  -v
```

## Step 5: Common Backend Issues

### Issue 1: Database Connection
**Symptom:** Backend can't connect to database
**Fix:** Check database is running
```bash
docker-compose ps
# Should show postgres running
```

### Issue 2: Missing Environment Variables
**Symptom:** Backend crashes on startup
**Fix:** Check `.env` file or environment variables
```bash
# Check backend config
cat backend/config.py
```

### Issue 3: JWT Token Validation Error
**Symptom:** Backend crashes when decoding token
**Fix:** Check JWT secret key matches
```bash
# Check backend JWT configuration
grep -r "SECRET_KEY" backend/
```

### Issue 4: Missing Dependencies
**Symptom:** Import errors in backend logs
**Fix:** Install requirements
```bash
cd backend
pip install -r requirements.txt
```

## Step 6: Frontend Debugging

**Check console logs:**
- When you send a question, you should see:
  - `🔵 API Request Debug:` - Shows request details
  - `🔴 Backend 500 Error:` - Shows error details

**Verify API endpoint:**
```javascript
// In browser console
console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://18.219.47.1:8001')
```

## Step 7: Quick Fixes to Try

### Fix 1: Clear and Re-login
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
// Then login again
```

### Fix 2: Check Backend is Running
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Fix 3: Restart Backend
```bash
cd /Users/emilio/Downloads/server
docker-compose restart backend
# OR if running directly, restart the Python process
```

## Step 8: Verify Request Format

**Correct Request:**
```json
POST /api/query
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body:
{
  "query": "your question here",
  "session_id": "optional-session-id"
}
```

**Incorrect (will cause errors):**
```json
{
  "query": "question",
  "user_id": "123"  // ❌ DON'T INCLUDE THIS
}
```

## Next Steps Based on Error

### If Backend Logs Show:
- **"Database connection failed"** → Check database is running
- **"JWT decode error"** → Token format issue, re-login
- **"User not found"** → User from token doesn't exist in DB
- **"Module not found"** → Backend dependencies missing
- **"AttributeError"** → Backend code bug

### If No Backend Logs:
- Backend might not be running
- Check if backend process is active
- Check if port 8000 is in use

## Still Not Working?

1. **Share backend logs** - The actual error traceback
2. **Share network request** - Screenshot of Network tab
3. **Share console output** - Browser console errors
4. **Check backend code** - Look at `backend/routers/query.py` line 29-105
