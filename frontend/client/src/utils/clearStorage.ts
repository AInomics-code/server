/**
 * Utility functions to clear browser storage
 * Useful for debugging and testing
 */

/**
 * Clear all authentication and user data
 */
export function clearAllStorage(): void {
  // Clear localStorage
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('dev_token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userLastName');
  localStorage.removeItem('isAdmin');
  
  localStorage.removeItem('isLoggedIn');
  
  console.log('✅ All storage cleared');
}

/**
 * Clear only authentication data (keeps other app data)
 */
export function clearAuthData(): void {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('dev_token');
  localStorage.removeItem('isLoggedIn');
  
  console.log('✅ Authentication data cleared');
}

/**
 * Clear everything (nuclear option)
 */
export function clearEverything(): void {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Everything cleared (localStorage + sessionStorage)');
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearStorage = clearAllStorage;
  (window as any).clearAuth = clearAuthData;
  (window as any).clearEverything = clearEverything;
  
  console.log('💡 Storage utilities available:');
  console.log('  - clearStorage() - Clear auth data');
  console.log('  - clearAuth() - Clear only auth');
  console.log('  - clearEverything() - Clear all storage');
}
