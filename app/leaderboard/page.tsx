'use client';

import React from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { MEMBERS, initials } from '@/lib/mockData';

export default function LeaderboardPage() {
  const ranked = [...MEMBERS].sort((a, b) => b.points - a.points);
  const top = ranked[0]?.points || 1;
  const rankClass = ['gold', 'silver', 'bronze'];

  return (
    <AppShell>
      <div data-testid="leaderboard-main">
        <div className="page-head">
          <div className="eyebrow">Standings</div>
          <h1>Leaderboard</h1>
          <p className="sub">Points earned by completing chores. Keep it up!</p>
        </div>

        {ranked.length === 0 ? (
          <div className="card empty">
            <div className="big">🏆</div>
            <div>No scores yet.</div>
          </div>
        ) : (
          <div className="card" style={{ padding: '6px 8px' }}>
            {ranked.map((m, i) => (
              <Link key={m.id} href={`/members/${m.id}`} className="lb-row">
                <span className={`lb-rank ${rankClass[i] || ''}`}>{i + 1}</span>
                <span className="avatar" style={{ width: 38, height: 38, background: m.avatarColor, fontSize: 14 }}>
                  {initials(m.name)}
                </span>
                <span className="lb-name">{m.name}</span>
                <span className="lb-bar-wrap"><span className="lb-bar" style={{ width: `${Math.round((m.points / top) * 100)}%` }} /></span>
                <span className="badge pts">{m.points} pts</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
