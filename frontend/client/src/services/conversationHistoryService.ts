import { API_CONFIG } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

export interface ConversationSummary {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  archived: boolean;
  message_count?: number;
}

export interface BackendMessage {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: { text?: string; components?: any[] };
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ConversationDetail {
  conversation: ConversationSummary;
  messages: BackendMessage[];
  message_count: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function listConversations(params?: {
  limit?: number;
  offset?: number;
  archived?: boolean;
}): Promise<{ conversations: ConversationSummary[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.offset != null) query.set('offset', String(params.offset));
  if (params?.archived != null) query.set('archived', String(params.archived));

  const res = await fetch(
    `${API_CONFIG.BASE_URL}/api/conversations?${query.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ conversations: ConversationSummary[]; total: number }>(res);
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/api/conversations/${conversationId}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<ConversationDetail>(res);
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/api/conversations/${conversationId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    }
  );
  return handleResponse<void>(res);
}

export async function deleteConversation(conversationId: string, permanent = false): Promise<void> {
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/api/conversations/${conversationId}?permanent=${permanent}`,
    { method: 'DELETE', headers: getAuthHeaders() }
  );
  return handleResponse<void>(res);
}
