'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  assignmentsForWeek,
  currentIsoWeek,
  shiftIsoWeek,
  weekLabel,
  WEEKDAYS,
  initials,
} from '@/lib/mockData';

export default function Dashboard() {
  const { member } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const week = params.get('week') || currentIsoWeek();
  const isCurrent = week === currentIsoWeek();

  const base = useMemo(() => assignmentsForWeek(week), [week]);
  // Local completion overrides so "Mark complete" feels live in the mockup.
  const [done, setDone] = useState<Record<number, boolean>>({});

  function goWeek(delta: number) {
    router.push(`/?week=${shiftIsoWeek(week, delta)}`);
  }

  if (!member) return null;

  const rows = base.map((a) => ({ ...a, completed: done[a.id] ?? a.completed }));
  const doneCount = rows.filter((r) => r.completed).length;
  const mine = rows.filter((r) => r.member.id === member.id);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">This Week's Chores</div>
        <h1 data-testid="home-title">Chore assignments</h1>
        <p className="sub">Who&apos;s on deck, what&apos;s due, and your chores to knock out.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="week-nav">
          <button onClick={() => goWeek(-1)} aria-label="Previous week">‹</button>
          <span className="wk">{weekLabel(week)}</span>
          <button onClick={() => goWeek(1)} aria-label="Next week">›</button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isCurrent && (
            <Link href="/" className="btn ghost sm">Jump to now</Link>
          )}
          <span className="badge pts">{doneCount}/{rows.length} done</span>
        </div>
      </div>

      {mine.length > 0 && (
        <div className="alert info">
          You have <strong>{mine.filter((m) => !m.completed).length}</strong> chore(s) still to do this week.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card empty">
          <div className="big">🧹</div>
          <div>No chores scheduled for this week.</div>
        </div>
      ) : (
        <div className="chore-list">
          {rows.map((a) => {
            const isMine = a.member.id === member.id;
            return (
              <div key={a.id} className="card chore-row">
                <div className="chore-main">
                  <span className="avatar" style={{ width: 44, height: 44, background: a.member.avatarColor, fontSize: 15 }}>
                    {initials(a.member.name)}
                  </span>
                  <div className="chore-info">
                    <div className="chore-name">{a.chore.name}</div>
                    <div className="chore-meta">
                      <span>Assigned to <Link href={`/members/${a.member.id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{isMine ? 'You' : a.member.name}</Link></span>
                      <span>· Due {WEEKDAYS[a.chore.dueDay]}</span>
                      <span>· {a.chore.pointValue} pts</span>
                    </div>
                  </div>
                </div>
                <div className="chore-right">
                  {isMine && !a.completed && <span className="mine-flag">YOUR CHORE</span>}
                  {a.completed ? (
                    <span className="badge done">✓ Done</span>
                  ) : isMine ? (
                    <button className="btn success sm" onClick={() => setDone((d) => ({ ...d, [a.id]: true }))}>
                      Mark complete
                    </button>
                  ) : (
                    <span className="badge pending">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
