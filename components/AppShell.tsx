'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { initials } from '@/lib/mockData';

interface NavDef {
  href: string;
  label: string;
  ico: string;
  adminOnly?: boolean;
  match: (path: string) => boolean;
}

const NAV: NavDef[] = [
  { href: '/', label: 'This Week', ico: '🗓️', match: (p) => p === '/' },
  { href: '/members', label: 'Members', ico: '👪', match: (p) => p.startsWith('/members') },
  { href: '/leaderboard', label: 'Leaderboard', ico: '🏆', match: (p) => p.startsWith('/leaderboard') },
  { href: '/admin/settings', label: 'Settings', ico: '⚙️', adminOnly: true, match: (p) => p.startsWith('/admin') },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { member, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Guard: unauthenticated users are redirected to /login (mirrors RequireAuth).
  useEffect(() => {
    if (ready && !member) router.replace('/login');
  }, [ready, member, router]);

  if (!member) return null;

  const items = NAV.filter((n) => !n.adminOnly || member.role === 'ADMIN');

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✓</span>
          <span>Chore Chart</span>
        </div>
        <nav>
          {items.map((n) => (
            <Link key={n.href} href={n.href} className={`nav-item ${n.match(pathname) ? 'active' : ''}`}>
              <span className="ico" aria-hidden>{n.ico}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link href={`/members/${member.id}`} className="user-chip">
            <span className="avatar" style={{ width: 36, height: 36, background: member.avatarColor, fontSize: 14 }}>
              {initials(member.name)}
            </span>
            <span className="meta">
              <span className="name">{member.name}</span>
              <span className="role">{member.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
            </span>
          </Link>
          <button className="btn ghost" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">✓</span>
            <span>Chore Chart</span>
          </div>
          <button className="btn ghost sm" onClick={handleLogout} aria-label="Log out">Log out</button>
        </header>

        <main className="content">{children}</main>

        <nav className="tabbar" aria-label="Primary">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className={`tab-item ${n.match(pathname) ? 'active' : ''}`}>
              <span className="ico" aria-hidden>{n.ico}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
