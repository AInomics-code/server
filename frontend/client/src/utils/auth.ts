/**
 * Authentication utility functions for JWT token management
 */

/**
 * Get the JWT token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('jwt_token');
}

/**
 * Set the JWT token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('jwt_token', token);
}

/**
 * Remove the JWT token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('jwt_token');
}

/**
 * Get the current user ID from localStorage
 * Returns the user_id from the JWT token payload or fallback to stored userId
 */
export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

/**
 * Get the current user email from localStorage
 */
export function getUserEmail(): string | null {
  return localStorage.getItem('userEmail');
}

/**
 * Get the current user's full name from localStorage
 */
export function getUserName(): string | null {
  const name = localStorage.getItem('userName');
  const lastName = localStorage.getItem('userLastName');
  if (name && lastName) {
    return `${name} ${lastName}`;
  }
  return name || null;
}

/**
 * Check if the current user is an admin
 */
export function isAdmin(): boolean {
  return localStorage.getItem('isAdmin') === 'true';
}

/**
 * Get all user information as an object
 */
export function getUserInfo(): {
  userId: string | null;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
} {
  return {
    userId: getUserId(),
    email: getUserEmail(),
    name: getUserName(),
    isAdmin: isAdmin(),
  };
}

/**
 * Clear all user data and authentication tokens
 */
export function clearUserData(): void {
  removeAuthToken();
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userLastName');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('dev_token');
  localStorage.removeItem('lastActivityTime');
  localStorage.removeItem('isLoggedIn');
}

/**
 * Logout function - clears all user data and redirects to login
 */
export function logout(): void {
  clearUserData();
  window.location.href = '/user-id-entry';
}

/**
 * Get authorization headers for API requests
 * Returns headers with Bearer token if available
 * In development mode, if no token exists, tries to use a default dev token
 */
export function getAuthHeaders(): HeadersInit {
  let token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // If no token, try dev token for development
  if (!token) {
    token = localStorage.getItem('dev_token');
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Log warning if no token is available (for debugging)
    console.warn('No JWT token found. API requests may fail if backend requires authentication.');
    console.warn('To set a dev token, run: localStorage.setItem("dev_token", "your-token-here")');
  }
  
  return headers;
}
