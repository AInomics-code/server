import { API_CONFIG } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

export interface User {
  user_id: string;
  email: string;
  name: string;
  last_name: string;
  admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreatePayload {
  email: string;
  name: string;
  last_name: string;
  password: string;
  admin: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  name?: string;
  last_name?: string;
  password?: string;
  admin?: boolean;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/users`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User[]>(res);
}

export async function getUserById(userId: string): Promise<User> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User>(res);
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<User>(res);
}

export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<User> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<User>(res);
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res);
}
