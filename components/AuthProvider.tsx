'use client';

// Auth context backed by the real JWT API. Persists the token in localStorage
// and hydrates the current member from GET /api/me on load. Guarded screens
// read `member`/`ready` to decide whether to render or redirect to /login.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Member } from '@/lib/mockData';
import { apiFetch, setToken, clearToken, getToken } from '@/lib/apiClient';

interface AuthState {
  member: Member | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!getToken()) {
        if (active) setReady(true);
        return;
      }
      try {
        const { member } = await apiFetch<{ member: Member }>('/me');
        if (active) setMember(member);
      } catch {
        clearToken();
        if (active) setMember(null);
      } finally {
        if (active) setReady(true);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const { token, member } = await apiFetch<{ token: string; member: Member }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    setMember(member);
  }

  async function signup(name: string, email: string, password: string) {
    const { token, member } = await apiFetch<{ token: string; member: Member }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(token);
    setMember(member);
  }

  function logout() {
    // Fire-and-forget; JWT is stateless so client-side token discard is enough.
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken();
    setMember(null);
  }

  return (
    <AuthCtx.Provider value={{ member, ready, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
