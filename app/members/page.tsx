'use client';

import React from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { MEMBERS, initials } from '@/lib/mockData';

export default function MembersPage() {
  return (
    <AppShell>
      <div data-testid="members-main">
        <div className="page-head">
          <div className="eyebrow">Household</div>
          <h1>Members</h1>
          <p className="sub">Everyone sharing the chore rotation.</p>
        </div>

        {MEMBERS.length === 0 ? (
          <div className="card empty">
            <div className="big">👪</div>
            <div>No members yet.</div>
          </div>
        ) : (
          <div className="grid">
            {MEMBERS.map((m) => (
              <Link key={m.id} href={`/members/${m.id}`} className="card member-card">
                <span className="avatar" style={{ width: 64, height: 64, background: m.avatarColor, fontSize: 22 }}>
                  {initials(m.name)}
                </span>
                <div className="m-name">{m.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="swatch" style={{ background: m.avatarColor }} />
                  <span className="muted" style={{ fontSize: 13 }}>{m.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
                </div>
                <span className="badge pts">🏅 {m.points} pts</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
