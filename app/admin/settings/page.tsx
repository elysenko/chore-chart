'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { SERVICE_SETTINGS } from '@/lib/mockData';

export default function AdminSettingsPage() {
  const { member, ready } = useAuth();
  const router = useRouter();

  // Non-admins are bounced to the dashboard.
  React.useEffect(() => {
    if (ready && member && member.role !== 'ADMIN') router.replace('/');
  }, [ready, member, router]);

  return (
    <AppShell>
      <div data-testid="admin-settings-main">
        <div className="page-head">
          <div className="eyebrow">Admin</div>
          <h1>Service settings</h1>
          <p className="sub">Configure the backing services provisioned for this household.</p>
        </div>

        {member?.role !== 'ADMIN' ? (
          <div className="card empty">
            <div className="big">🔒</div>
            <div>Admin access required.</div>
          </div>
        ) : (
          SERVICE_SETTINGS.map((svc) => <ServiceForm key={svc.key} svc={svc} />)
        )}
      </div>
    </AppShell>
  );
}

function ServiceForm({ svc }: { svc: (typeof SERVICE_SETTINGS)[number] }) {
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    // Mock PATCH /api/admin/settings — real app upserts SystemSetting rows.
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <form className="card svc-card" onSubmit={onSave}>
      <div className="svc-head">
        <div className="svc-title">{svc.label}</div>
        <span className={`badge ${svc.configured ? 'ok' : 'off'}`}>
          {svc.configured ? '● Configured' : '○ Not configured'}
        </span>
      </div>
      <div className="svc-desc">{svc.description}</div>

      {svc.fields.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={`${svc.key}-${f.key}`}>{f.label}</label>
          <input
            id={`${svc.key}-${f.key}`}
            className="input"
            type={f.masked ? 'password' : 'text'}
            placeholder={f.placeholder}
            value={values[f.key] || ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn" type="submit">Save {svc.label}</button>
        {saved && <span className="badge done">✓ Saved</span>}
      </div>
    </form>
  );
}
