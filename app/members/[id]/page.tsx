'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { apiFetch, HistoryDTO } from '@/lib/apiClient';
import { initials, weekLabel, WEEKDAYS, Member } from '@/lib/mockData';

export default function MemberDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ member: Member; history: HistoryDTO[] }>(`/members/${id}`)
      .then((d) => {
        setMember(d.member);
        setHistory(d.history);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppShell>
      <div data-testid="member-detail-main">
        <Link href="/members" className="btn ghost sm" style={{ marginBottom: 18 }}>‹ All members</Link>

        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : !member || notFound ? (
          <div className="card empty">
            <div className="big">🔍</div>
            <div>Member not found.</div>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <span className="avatar" style={{ width: 72, height: 72, background: member.avatarColor, fontSize: 26 }}>
                {initials(member.name)}
              </span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <h1 style={{ fontSize: 24 }}>{member.name}</h1>
                <p className="muted" style={{ marginTop: 4 }}>{member.email}</p>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge pts">🏅 {member.points} pts</span>
                  <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                    {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                </div>
              </div>
            </div>

            <div className="section-title">Chore history</div>
            <HistoryList history={history} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function HistoryList({ history }: { history: HistoryDTO[] }) {
  if (history.length === 0) {
    return (
      <div className="card empty">
        <div className="big">📋</div>
        <div>No chores assigned yet.</div>
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: '4px 18px' }}>
      <div className="hist">
        {history.map((a) => (
          <div key={a.id} className="hist-row">
            <div>
              <div style={{ fontWeight: 700 }}>{a.chore.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {weekLabel(a.isoWeek)} · Due {WEEKDAYS[a.chore.dueDay]}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="muted" style={{ fontSize: 13 }}>{a.chore.pointValue} pts</span>
              {a.completed
                ? <span className="badge done">✓ Done</span>
                : <span className="badge pending">Pending</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
