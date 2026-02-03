# Easy User ID Access Guide

## Quick Access Functions

I've added utility functions to easily access user information. Import them from `@/utils/auth`:

```typescript
import { 
  getUserId, 
  getUserEmail, 
  getUserName, 
  isAdmin, 
  getUserInfo,
  clearUserData 
} from '@/utils/auth';
```

## Available Functions

### `getUserId(): string | null`
Get the current user's ID (UUID from backend)

```typescript
const userId = getUserId();
// Returns: "0cbdab40-f680-4e67-b6b7-737d1f966b64" or null
```

### `getUserEmail(): string | null`
Get the current user's email

```typescript
const email = getUserEmail();
// Returns: "admin@vorta.com" or null
```

### `getUserName(): string | null`
Get the current user's full name (name + last_name)

```typescript
const name = getUserName();
// Returns: "Admin User" or null
```

### `isAdmin(): boolean`
Check if the current user is an admin

```typescript
const admin = isAdmin();
// Returns: true or false
```

### `getUserInfo(): object`
Get all user information at once

```typescript
const userInfo = getUserInfo();
// Returns: {
//   userId: "uuid",
//   email: "admin@vorta.com",
//   name: "Admin User",
//   isAdmin: true
// }
```

### `clearUserData(): void`
Clear all user data and tokens (useful for logout)

```typescript
clearUserData();
// Removes: jwt_token, userId, userEmail, userName, userLastName, isAdmin, isLoggedIn
```

## Usage Examples

### In a React Component

```typescript
import { getUserId, getUserInfo, isAdmin } from '@/utils/auth';

function MyComponent() {
  const userId = getUserId();
  const userInfo = getUserInfo();
  const admin = isAdmin();
  
  if (!userId) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>User ID: {userId}</p>
      <p>Email: {userInfo.email}</p>
      <p>Name: {userInfo.name}</p>
      {admin && <p>You are an admin</p>}
    </div>
  );
}
```

### In API Calls

```typescript
import { getUserId } from '@/utils/auth';

// The user ID is automatically extracted from JWT token in API calls
// But you can still access it if needed:
const userId = getUserId();
console.log('Current user:', userId);
```

### For Logout

```typescript
import { clearUserData } from '@/utils/auth';
import { useLocation } from 'wouter';

function LogoutButton() {
  const [, setLocation] = useLocation();
  
  const handleLogout = () => {
    clearUserData();
    setLocation('/user-id-entry');
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## Where User Data is Stored

After login, the following data is stored in `localStorage`:
- `jwt_token` - The JWT authentication token
- `userId` - The user's UUID from backend
- `userEmail` - The user's email address
- `userName` - The user's first name
- `userLastName` - The user's last name
- `isAdmin` - "true" or "false" string

And in `sessionStorage`:
- `isLoggedIn` - "true" string

## Notes

- All functions return `null` if the data doesn't exist
- `isAdmin()` returns `false` if not set or not admin
- `getUserName()` combines name and last_name if both exist
- `clearUserData()` removes all user-related data for a clean logout
