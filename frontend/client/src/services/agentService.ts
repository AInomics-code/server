import { API_CONFIG } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

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
        session_id: string;
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
        // ⚠️ IMPORTANT: user_id is NOT sent in the body anymore
        // The backend extracts user_id from the JWT token automatically
        const requestBody: any = {
            query,
            // Only include session_id if it's not empty (for continuing conversations)
            ...(sessionId && { session_id: sessionId })
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.QUERY_ENDPOINT}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            // If 403, provide helpful message about authentication
            if (response.status === 403) {
                const token = localStorage.getItem('jwt_token') || localStorage.getItem('dev_token');
                if (!token) {
                    throw new Error(`Authentication required (403). Please log in or set a dev token. Error: ${errorText}`);
                } else {
                    throw new Error(`Authentication failed (403). Token may be invalid or expired. Error: ${errorText}`);
                }
            }
            
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        return response.json();
    }
};

