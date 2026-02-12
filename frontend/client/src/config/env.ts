// In development, use relative URLs to go through Vite proxy (avoids CORS)
// In production, use the full backend URL
const isDevelopment = import.meta.env.DEV;
const backendUrl = import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ENV_CONFIG = {
    API_URL: isDevelopment ? '' : backendUrl, // Empty string = relative URL (uses Vite proxy in dev)
    APP_LANGUAGE: import.meta.env.VITE_APP_LANGUAGE || import.meta.env.NEXT_PUBLIC_APP_LANGUAGE || 'en'
};
