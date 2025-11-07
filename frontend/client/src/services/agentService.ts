import { API_CONFIG } from '../config/api';

export interface QueryRequest {
    query: string;
    user_id: string;
    session_id: string;
}

export interface QueryResponse {
    message: string;
    data: any | null;
    queries_executed: any[];
    metadata: {
        session_id: string;
        query_type: string;
        latency_ms: number;
        type: string;
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
     */
    async sendQuery(query: string, userId: string, sessionId: string): Promise<QueryResponse> {
        const requestBody: QueryRequest = {
            query,
            user_id: userId,
            session_id: sessionId
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.QUERY_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        return response.json();
    }
};

