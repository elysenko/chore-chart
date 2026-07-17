// ISO-week helpers (server-side). Kept byte-for-byte compatible with the
// client copies in lib/mockData.ts so a week string produced by the browser
// resolves to the same rotation index on the server.

const WEEK_MS = 7 * 86400000;

/** ISO-8601 week string for a date, e.g. "2026-W29". */
export function isoWeekString(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const fdn = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdn + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / WEEK_MS);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function currentIsoWeek(): string {
  return isoWeekString(new Date());
}

/** Validates a "YYYY-Www" string; returns null if malformed. */
export function parseIsoWeek(str: string | null | undefined): string | null {
  if (!str) return null;
  const m = /^(\d{4})-W(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  return `${m[1]}-W${m[2]}`;
}

/** The Monday (UTC) that opens the given ISO week. */
export function mondayOfIsoWeek(iso: string): Date {
  const [y, w] = iso.split('-W');
  const year = Number(y);
  const week = Number(w);
  const simple = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in week 1
  const dayNum = (simple.getUTCDay() + 6) % 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dayNum + (week - 1) * 7);
  return monday;
}

/** Monotonic integer index of the week — used for the rotation formula. */
export function weekIndex(iso: string): number {
  const monday = mondayOfIsoWeek(iso);
  return Math.floor(monday.getTime() / WEEK_MS);
}
