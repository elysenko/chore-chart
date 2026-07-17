'use client';

// Mock auth context for the frontend mockup. Persists a "session" in localStorage
// so guarded screens render populated in the preview. The real app swaps this for
// JWT calls to POST /api/auth/login|signup|logout and GET /api/me.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MEMBERS, Member } from '@/lib/mockData';

interface AuthState {
  member: Member | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'chorechart.session';
const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to the demo admin so preview screens are populated on first load.
  const [member, setMember] = useState<Member | null>(MEMBERS[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setMember(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function persist(m: Member | null) {
    setMember(m);
    try {
      if (m) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function login(email: string) {
    const found = MEMBERS.find((m) => m.email.toLowerCase() === email.toLowerCase());
    persist(found ?? MEMBERS[0]);
  }

  async function signup(name: string, email: string) {
    const newMember: Member = {
      id: MEMBERS.length + 1,
      name: name || 'New Member',
      email,
      avatarColor: '#0ea5e9',
      points: 0,
      role: 'USER',
    };
    persist(newMember);
  }

  function logout() {
    persist(null);
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
