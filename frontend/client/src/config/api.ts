import { ENV_CONFIG } from './env';

export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_URL,
  INVOKE_ENDPOINT: '/api/v1/invoke',
  QUERY_ENDPOINT: '/api/query'
};
