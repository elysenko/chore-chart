'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/apiClient';
import { initials, Member } from '@/lib/mockData';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ members: Member[] }>('/members')
      .then((d) => setMembers(d.members))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div data-testid="members-main">
        <div className="page-head">
          <div className="eyebrow">Household</div>
          <h1>Members</h1>
          <p className="sub">Everyone sharing the chore rotation.</p>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : members.length === 0 ? (
          <div className="card empty">
            <div className="big">👪</div>
            <div>No members yet.</div>
          </div>
        ) : (
          <div className="grid">
            {members.map((m) => (
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
