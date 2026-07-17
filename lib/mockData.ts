// Mock data + deterministic rotation for the Chore Chart frontend mockup.
// The real app replaces these with API calls (GET /api/assignments, /api/members,
// /api/leaderboard, ...). Kept client-safe so preview screens render populated.

export type Role = 'ADMIN' | 'USER';

export interface Member {
  id: number;
  name: string;
  email: string;
  avatarColor: string;
  points: number;
  role: Role;
}

export interface Chore {
  id: number;
  name: string;
  pointValue: number;
  dueDay: number; // 0=Sun .. 6=Sat
  rotationOffset: number;
}

export interface Assignment {
  id: number;
  chore: Chore;
  member: Member;
  isoWeek: string;
  completed: boolean;
}

export const MEMBERS: Member[] = [
  { id: 1, name: 'Ava Thompson', email: 'ava@chorechart.app', avatarColor: '#6366f1', points: 48, role: 'ADMIN' },
  { id: 2, name: 'Liam Chen', email: 'liam@chorechart.app', avatarColor: '#10b981', points: 42, role: 'USER' },
  { id: 3, name: 'Maya Patel', email: 'maya@chorechart.app', avatarColor: '#f59e0b', points: 51, role: 'USER' },
  { id: 4, name: 'Noah Garcia', email: 'noah@chorechart.app', avatarColor: '#ef4444', points: 37, role: 'USER' },
  { id: 5, name: 'Sofia Rossi', email: 'sofia@chorechart.app', avatarColor: '#ec4899', points: 29, role: 'USER' },
];

export const CHORES: Chore[] = [
  { id: 1, name: 'Take out the trash', pointValue: 5, dueDay: 1, rotationOffset: 0 },
  { id: 2, name: 'Wash the dishes', pointValue: 3, dueDay: 2, rotationOffset: 1 },
  { id: 3, name: 'Vacuum living room', pointValue: 4, dueDay: 3, rotationOffset: 2 },
  { id: 4, name: 'Clean the bathroom', pointValue: 6, dueDay: 4, rotationOffset: 3 },
  { id: 5, name: 'Mow the lawn', pointValue: 8, dueDay: 5, rotationOffset: 4 },
  { id: 6, name: 'Fold the laundry', pointValue: 4, dueDay: 6, rotationOffset: 5 },
];

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---- ISO week helpers ----
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

// ---- Rotation: assignee = members[(offset + weekIndex) % memberCount] ----
export function assignmentsForWeek(iso: string): Assignment[] {
  const idx = weekIndex(iso);
  const n = MEMBERS.length;
  return CHORES.map((chore, i) => {
    const member = MEMBERS[(chore.rotationOffset + idx) % n];
    // Deterministic pseudo-completion so past/populated weeks look lived-in.
    const completed = (idx + i) % 3 === 0;
    return {
      id: chore.id * 1000 + (idx % 1000),
      chore,
      member,
      isoWeek: iso,
      completed,
    };
  });
}

// History for a member: their assignments across the last N weeks.
export function historyForMember(memberId: number, weeks = 6): Assignment[] {
  const rows: Assignment[] = [];
  let iso = currentIsoWeek();
  for (let k = 0; k < weeks; k++) {
    for (const a of assignmentsForWeek(iso)) {
      if (a.member.id === memberId) rows.push(a);
    }
    iso = shiftIsoWeek(iso, -1);
  }
  return rows;
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
