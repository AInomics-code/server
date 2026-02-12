import { API_CONFIG } from '../config/api';
import { getAuthHeaders } from '../utils/auth';
import { MOCK_MODE, generateMockResponse, simulateApiDelay } from './mockService';

export interface QueryRequest {
    query: string;
    session_id?: string;  // Optional - user_id comes from JWT token now
}

// Component types from API docs
export type ComponentType = 
  | 'text'
  | 'bar_chart'
  | 'line_chart'
  | 'area_chart'
  | 'pie_chart'
  | 'bubble_chart'
  | 'radar_chart'
  | 'scatter_chart'
  | 'polar_chart'
  | 'mixed_chart';

export interface BaseComponent {
  type: ComponentType;
  data: any;
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  data: string; // Markdown string
}

export interface ChartComponent extends BaseComponent {
  type: 'bar_chart' | 'line_chart' | 'area_chart' | 'scatter_chart' | 'mixed_chart';
  data: {
    title: string;
    x_axis_label: string;
    y_axis_label: string;
    datasets: Array<{
      label: string;
      type?: 'bar' | 'line'; // For mixed_chart
      data: Array<{ x: string | number; y: number }>;
    }>;
  };
}

export interface PieChartComponent extends BaseComponent {
  type: 'pie_chart' | 'polar_chart';
  data: {
    title: string;
    datasets: Array<{
      label: string;
      data: Array<{ label: string; value: number }>;
    }>;
  };
}

export interface BubbleChartComponent extends BaseComponent {
  type: 'bubble_chart';
  data: {
    title: string;
    x_axis_label: string;
    y_axis_label: string;
    datasets: Array<{
      label: string;
      data: Array<{ x: number; y: number; r: number; label?: string }>;
    }>;
  };
}

export interface RadarChartComponent extends BaseComponent {
  type: 'radar_chart';
  data: {
    title: string;
    datasets: Array<{
      label: string;
      data: Array<{ axis: string; value: number }>;
    }>;
  };
}

export type Component = 
  | TextComponent
  | ChartComponent
  | PieChartComponent
  | BubbleChartComponent
  | RadarChartComponent;

export interface QueryResponse {
    message: Component[];
    metadata: {
        conversation_id: string;
        query_type: 'simple' | 'dynamic';
        latency_ms: number;
        type: 'simple_agent' | 'dynamic';
    };
}

/**
 * Generate a unique session ID for the chat session
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const agentService = {
    /**
     * Send a query to the agent API
     * NOTE: user_id is no longer sent in the body - it comes from the JWT token
     */
    async sendQuery(query: string, userId: string, sessionId: string): Promise<QueryResponse> {
        // MOCK MODE: Return mock response for design development
        if (MOCK_MODE) {
            console.log('🎨 MOCK MODE: Using mock response for design development');
            await simulateApiDelay(); // Simulate API delay
            return generateMockResponse(query);
        }
        
        // ⚠️ IMPORTANT: user_id is NOT sent in the body anymore
        // The backend extracts user_id from the JWT token automatically
        const requestBody: any = {
            query,
            // Only include session_id if it's not empty (for continuing conversations)
            ...(sessionId && { session_id: sessionId })
        };

        const headers = getAuthHeaders();
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('dev_token');
        
        // Check if token is expired
        let tokenExpired = false;
        let tokenExpiryDate: Date | null = null;
        if (token) {
            try {
                // Decode JWT token (just the payload, no verification)
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp) {
                    tokenExpiryDate = new Date(payload.exp * 1000);
                    tokenExpired = tokenExpiryDate < new Date();
                }
            } catch (e) {
                // Token format invalid
                console.warn('⚠️ Token format invalid, cannot check expiration');
            }
        }
        
        // Debug logging
        console.log('🔵 API Request Debug:', {
            endpoint: `${API_CONFIG.BASE_URL}${API_CONFIG.QUERY_ENDPOINT}`,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
            tokenExpired,
            tokenExpiryDate: tokenExpiryDate?.toISOString() || 'unknown',
            headers: Object.keys(headers),
            requestBody,
        });
        
        if (tokenExpired) {
            console.error('🔴 Token is expired! Please log in again.');
            localStorage.removeItem('jwt_token');
            sessionStorage.removeItem('isLoggedIn');
            setTimeout(() => {
                window.location.href = '/user-id-entry';
            }, 1000);
            throw new Error('Your session has expired. Please log in again.');
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.QUERY_ENDPOINT}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            // If 401, token is invalid/expired - redirect to login
            if (response.status === 401) {
                console.error('🔴 Authentication Error (401):', {
                    endpoint: `${API_CONFIG.BASE_URL}${API_CONFIG.QUERY_ENDPOINT}`,
                    hasToken: !!token,
                    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
                    errorText,
                });
                
                // Clear invalid token
                localStorage.removeItem('jwt_token');
                sessionStorage.removeItem('isLoggedIn');
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = '/user-id-entry';
                }, 2000);
                
                throw new Error(`Authentication failed (401). Your session has expired. Please log in again. Redirecting to login...`);
            }
            
            // If 403, provide helpful message about authentication
            if (response.status === 403) {
                const token = localStorage.getItem('jwt_token') || localStorage.getItem('dev_token');
                if (!token) {
                    throw new Error(`Authentication required (403). Please log in or set a dev token. Error: ${errorText}`);
                } else {
                    throw new Error(`Authentication failed (403). Token may be invalid or expired. Error: ${errorText}`);
                }
            }
            
            // If 500, provide more helpful message
            if (response.status === 500) {
                console.error('🔴 Backend 500 Error:', {
                    endpoint: `${API_CONFIG.BASE_URL}${API_CONFIG.QUERY_ENDPOINT}`,
                    errorText,
                    hasToken: !!(localStorage.getItem('jwt_token') || localStorage.getItem('dev_token')),
                });
                throw new Error(`Backend server error (500). The server encountered an internal error. This is a backend issue - please check the backend logs. Error: ${errorText || 'No error details provided'}`);
            }
            
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        return response.json();
    }
};

