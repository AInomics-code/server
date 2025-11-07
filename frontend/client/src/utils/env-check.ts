// Environment validation utility
import { ENV_CONFIG } from '../config/env';

export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!ENV_CONFIG.API_URL) {
    errors.push('VITE_API_URL is required');
  }
  
  if (ENV_CONFIG.API_URL === 'http://localhost:8000' && import.meta.env.PROD) {
    errors.push('VITE_API_URL is still set to localhost in production');
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:');
    errors.forEach(error => console.error(`- ${error}`));
  } else {
    console.log('✅ Environment configuration is valid');
    console.log(`🌐 API URL: ${ENV_CONFIG.API_URL}`);
  }
  
  return errors.length === 0;
};

// Auto-validate in development
if (import.meta.env.DEV) {
  validateEnvironment();
}
