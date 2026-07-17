'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('ava@chorechart.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit} data-testid="login-main">
        <div className="auth-brand"><span className="brand-mark">✓</span> Chore Chart</div>
        <div className="auth-sub">Sign in to see this week&apos;s chores.</div>

        {error && <div className="alert err" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@household.app" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <button className="btn block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="auth-alt">
          New here? <Link href="/signup">Create an account</Link>
        </div>

        <div className="demo-hint">
          Demo login — <code>ava@chorechart.app</code> / <code>password123</code>
        </div>
      </form>
    </div>
  );
}
