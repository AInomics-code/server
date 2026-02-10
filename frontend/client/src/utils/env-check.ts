// Environment validation utility
import { ENV_CONFIG } from '../config/env';

export const validateEnvironment = () => {
  const errors: string[] = [];
  
  // In development, empty string is valid (uses Vite proxy)
  // In production, we need an actual URL
  if (import.meta.env.PROD && !ENV_CONFIG.API_URL) {
    errors.push('NEXT_PUBLIC_API_URL or VITE_API_URL is required in production');
  }
  
  if (ENV_CONFIG.API_URL === 'http://localhost:8000' && import.meta.env.PROD) {
    errors.push('API_URL is still set to localhost in production');
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:');
    errors.forEach(error => console.error(`- ${error}`));
  } else {
    const apiUrl = ENV_CONFIG.API_URL || '(using Vite proxy in dev)';
    console.log('✅ Environment configuration is valid');
    console.log(`🌐 API URL: ${apiUrl}`);
  }
  
  return errors.length === 0;
};

// Auto-validate in development
if (import.meta.env.DEV) {
  validateEnvironment();
}
