# How to Clear Storage in Browser Console

## Step-by-Step Instructions:

1. **Open DevTools** (F12 or Right-click → Inspect)

2. **Click the "Console" tab** at the top of DevTools

3. **Copy and paste this command** into the console (the input field at the bottom):

```javascript
localStorage.clear(); sessionStorage.clear(); location.reload();
```

4. **Press Enter**

5. The page will reload and you should see the login page

## Alternative: Use the Utility Page

Instead of using the console, you can also:

1. Navigate to: `http://localhost:5173/clear-storage.html`
2. Click the "Clear Authentication Data" button
3. It will automatically redirect you to the login page

## What Gets Cleared:

✅ **Safe to clear:**
- Login tokens (JWT)
- User ID, email, name
- Session data

❌ **Does NOT delete:**
- Your code files
- Your project files
- Any files on your computer

## Quick Console Commands:

If you want to clear just authentication data (safer):

```javascript
localStorage.removeItem('jwt_token');
localStorage.removeItem('userId');
localStorage.removeItem('userEmail');
localStorage.removeItem('userName');
localStorage.removeItem('isAdmin');
sessionStorage.removeItem('isLoggedIn');
location.reload();
```

Or clear everything:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```
