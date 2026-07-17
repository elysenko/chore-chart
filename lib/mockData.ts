// Shared client-side types and pure UI helpers for the Chore Chart frontend.
// The mock data arrays were removed once the real API landed — screens now read
// from GET /api/assignments, /api/members, /api/leaderboard, /api/members/:id.
// The ISO-week + presentation helpers below stay client-safe.

export type Role = 'ADMIN' | 'USER';

export interface Member {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  points: number;
  role: Role;
}

export interface Chore {
  id: string;
  name: string;
  pointValue: number;
  dueDay: number; // 0=Sun .. 6=Sat
  rotationOffset: number;
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---- ISO week helpers (mirror lib/week.ts on the server) ----
export function isoWeekString(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const fdn = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdn + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function currentIsoWeek(): string {
  return isoWeekString(new Date());
}

export function mondayOfIsoWeek(iso: string): Date {
  const [y, w] = iso.split('-W');
  const year = Number(y);
  const week = Number(w);
  const simple = new Date(Date.UTC(year, 0, 4)); // Jan 4 always in week 1
  const dayNum = (simple.getUTCDay() + 6) % 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dayNum + (week - 1) * 7);
  return monday;
}

export function shiftIsoWeek(iso: string, deltaWeeks: number): string {
  const monday = mondayOfIsoWeek(iso);
  monday.setUTCDate(monday.getUTCDate() + deltaWeeks * 7);
  return isoWeekString(monday);
}

export function weekIndex(iso: string): number {
  const monday = mondayOfIsoWeek(iso);
  return Math.floor(monday.getTime() / (7 * 86400000));
}

export function weekLabel(iso: string): string {
  const monday = mondayOfIsoWeek(iso);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString(undefined, opts)} · ${iso.replace('-', ' ')}`;
}

export function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export interface ServiceSetting {
  key: string;
  label: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; masked?: boolean }[];
  configured: boolean;
}

export const SERVICE_SETTINGS: ServiceSetting[] = [
  {
    key: 'postgresql',
    label: 'PostgreSQL',
    description: 'Primary relational datastore connection for the household.',
    configured: true,
    fields: [
      { key: 'PG_HOST', label: 'Host', placeholder: 'db.internal' },
      { key: 'PG_DATABASE', label: 'Database', placeholder: 'chorechart' },
      { key: 'PG_USER', label: 'User', placeholder: 'chore_app' },
      { key: 'PG_PASSWORD', label: 'Password', placeholder: '••••••••', masked: true },
    ],
  },
  {
    key: 'minio',
    label: 'MinIO',
    description: 'Object storage for member avatars and exported chore reports.',
    configured: false,
    fields: [
      { key: 'MINIO_ENDPOINT', label: 'Endpoint', placeholder: 's3.internal:9000' },
      { key: 'MINIO_ACCESS_KEY', label: 'Access key', placeholder: 'AKIA…' },
      { key: 'MINIO_SECRET_KEY', label: 'Secret key', placeholder: '••••••••', masked: true },
    ],
  },
];
