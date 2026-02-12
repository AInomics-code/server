# Debugging Login Issues

## Common Issues and Solutions

### 1. Backend Not Running
**Check if backend is running:**
```bash
# Check if backend process is running
ps aux | grep uvicorn
# Or check if port 8000 is listening
lsof -i :8000
# Or test the health endpoint
curl http://localhost:8000/health
```

**Solution:** Start the backend server
```bash
cd /Users/emilio/Downloads/server/backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Port Mismatch
**Issue:** Backend runs on port 8000, but Vite proxy targets port 8001

**Current Configuration:**
- Backend: `http://localhost:8000` (from app.py)
- Vite Proxy Default: `http://18.219.47.1:8001` (from vite.config.ts)

**Solution:** Set the correct backend URL

**Option A: Create `.env` file in frontend directory**
```bash
cd /Users/emilio/Downloads/server/frontend
echo "VITE_API_URL=http://localhost:8000" > .env
```

**Option B: Update vite.config.ts default**
Change line 42 in `vite.config.ts`:
```typescript
target: env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
```

### 3. CORS Issues
**Check browser console for CORS errors**

**Solution:** Backend CORS is configured in `app.py`. Make sure:
- Frontend origin is in `allow_origins` list
- Backend is running and accessible

### 4. Network Connectivity
**Test backend directly:**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vorta.com","password":"admin123"}'
```

### 5. Database Connection
**Check if backend can connect to database:**
- Backend needs PostgreSQL connection
- Check `backend/config.py` for database settings
- Verify database is running and accessible

### 6. User Doesn't Exist
**Check if admin user exists:**
```bash
cd /Users/emilio/Downloads/server/backend
python test_login_local.py
```

**Default admin credentials (if user exists):**
- Email: `admin@vorta.com`
- Password: `admin123`

## Quick Debugging Steps

1. **Check browser console** - Look for network errors
2. **Check backend logs** - See if requests are reaching backend
3. **Test endpoint directly** - Use curl to test backend
4. **Verify proxy** - Check Vite dev server console for proxy logs
5. **Check environment variables** - Verify VITE_API_URL is set correctly

## Expected Behavior

**When login works:**
- Frontend sends POST to `/api/auth/login`
- Vite proxy forwards to `http://localhost:8000/api/auth/login`
- Backend responds with JWT token
- Frontend stores token and redirects to chat

**When login fails:**
- Check browser Network tab for the request
- Look at response status and error message
- Check backend logs for errors
