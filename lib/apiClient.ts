'use client';

// Browser fetch wrapper. Attaches the JWT as `Authorization: Bearer <token>`
// and normalizes error responses into thrown Error(message).
import type { Member } from './mockData';

const TOKEN_KEY = 'chorechart.token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// Next.js may be served under a per-deploy base path; prefix API calls with it.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Typed response shapes ----
export interface ChoreDTO {
  id: string;
  name: string;
  pointValue: number;
  dueDay: number;
  rotationOffset: number;
}

export interface AssignmentDTO {
  id: string;
  isoWeek: string;
  completed: boolean;
  completedAt: string | null;
  chore: ChoreDTO;
  member: Member;
}

export interface HistoryDTO {
  id: string;
  isoWeek: string;
  completed: boolean;
  completedAt: string | null;
  chore: ChoreDTO;
}
