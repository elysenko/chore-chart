'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import { SERVICE_SETTINGS, ServiceSetting } from '@/lib/mockData';

// Live status for a single service key, as reported by GET /api/admin/settings.
// `configured` reflects an env var (mounted from infra secrets) OR a saved
// SystemSetting DB row; the raw value is never returned by the API.
interface LiveSetting {
  key: string;
  configured: boolean;
  source: 'env' | 'db' | null;
  updatedAt: string | null;
}

export default function AdminSettingsPage() {
  const { member, ready } = useAuth();
  const router = useRouter();

  const [live, setLive] = useState<Record<string, LiveSetting>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Non-admins are bounced to the dashboard.
  useEffect(() => {
    if (ready && member && member.role !== 'ADMIN') router.replace('/');
  }, [ready, member, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ settings: LiveSetting[] }>('/admin/settings');
      const map: Record<string, LiveSetting> = {};
      for (const s of data.settings) map[s.key] = s;
      setLive(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load service settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && member?.role === 'ADMIN') load();
  }, [ready, member, load]);

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
        ) : error ? (
          <div className="alert err" role="alert">{error}</div>
        ) : loading ? (
          <div className="skeleton" style={{ height: 220 }} />
        ) : (
          SERVICE_SETTINGS.map((svc) => (
            <ServiceForm key={svc.key} svc={svc} live={live} onSaved={load} />
          ))
        )}
      </div>
    </AppShell>
  );
}

function ServiceForm({
  svc,
  live,
  onSaved,
}: {
  svc: ServiceSetting;
  live: Record<string, LiveSetting>;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  // A service is "configured" when every one of its keys resolves to a value
  // (env var or saved DB row), per the live status from the API.
  const configured = svc.fields.every((f) => live[f.key]?.configured);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const payload = svc.fields
      .filter((f) => (values[f.key] || '').trim() !== '')
      .map((f) => ({ key: f.key, value: values[f.key].trim() }));
    if (payload.length === 0) {
      setErr('Enter at least one value to save.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setValues({});
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card svc-card" onSubmit={onSave}>
      <div className="svc-head">
        <div className="svc-title">{svc.label}</div>
        <span className={`badge ${configured ? 'ok' : 'off'}`}>
          {configured ? '● Configured' : '○ Not configured'}
        </span>
      </div>
      <div className="svc-desc">{svc.description}</div>

      {err && <div className="alert err" role="alert">{err}</div>}

      {svc.fields.map((f) => {
        const status = live[f.key];
        return (
          <div className="field" key={f.key}>
            <label htmlFor={`${svc.key}-${f.key}`}>
              {f.label}
              {status?.configured && (
                <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
                  ● set{status.source ? ` via ${status.source}` : ''}
                </span>
              )}
            </label>
            <input
              id={`${svc.key}-${f.key}`}
              className="input"
              type={f.masked ? 'password' : 'text'}
              placeholder={status?.configured ? '•••••••• (set — enter to override)' : f.placeholder}
              value={values[f.key] || ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        );
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : `Save ${svc.label}`}
        </button>
        {saved && <span className="badge done">✓ Saved</span>}
      </div>
    </form>
  );
}
