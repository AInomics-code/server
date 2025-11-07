import { API_CONFIG } from '../config/api';

export interface InvokeRequest {
    message: string;
}

export interface InvokeResponse {
    input: string;
    plan: string[];
    response: string;
    sources: string[];
    execution_successful: boolean;
}

export const apiService = {
    async invokeAI(message: string): Promise<InvokeResponse> {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.INVOKE_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message } as InvokeRequest),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
    }
};
