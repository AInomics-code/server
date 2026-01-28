export const ENV_CONFIG = {
    API_URL: import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'https://ladonaapi.ainomics.online',
    APP_LANGUAGE: import.meta.env.VITE_APP_LANGUAGE || import.meta.env.NEXT_PUBLIC_APP_LANGUAGE || 'en'
};
