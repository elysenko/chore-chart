'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await signup(name, email, password);
      router.replace('/');
    } catch {
      setError('Could not create your account. Try a different email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit} data-testid="signup-main">
        <div className="auth-brand"><span className="brand-mark">✓</span> Chore Chart</div>
        <div className="auth-sub">Join your household&apos;s chore rotation.</div>

        {error && <div className="alert err" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" type="text" autoComplete="name"
            value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@household.app" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>

        <button className="btn block" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <div className="auth-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>

        <div className="demo-hint">
          The first member to sign up becomes the household <strong>admin</strong>.
        </div>
      </form>
    </div>
  );
}
