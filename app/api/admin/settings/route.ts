import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Admin-only view of runtime service settings. Effective value priority:
//   1. environment variable (mounted from infra secrets at deploy time)
//   2. SystemSetting DB row (set via the admin panel)
// The raw value is never returned — only whether the key is configured.
const KNOWN_KEYS = [
  'DATABASE_URL',
  'PG_HOST',
  'PG_DATABASE',
  'PG_USER',
  'PG_PASSWORD',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
];

async function requireAdmin(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };
  return { user };
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const rows = await db.systemSetting.findMany();
  const dbMap = new Map(rows.map((r) => [r.key, r]));
  const keys = new Set<string>([...KNOWN_KEYS, ...dbMap.keys()]);

  const settings = Array.from(keys)
    .sort()
    .map((key) => {
      const envGood = !!process.env[key];
      const dbRow = dbMap.get(key);
      const dbGood = !!dbRow?.value;
      const source = envGood ? 'env' : dbGood ? 'db' : null;
      return { key, configured: envGood || dbGood, source, updatedAt: dbRow?.updatedAt ?? null };
    });

  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let body: Array<{ key: string; value: string }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected an array of { key, value }.' }, { status: 400 });
  }

  await Promise.all(
    body
      .filter((s) => s?.key && typeof s.value === 'string')
      .map(({ key, value }) =>
        db.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } }),
      ),
  );

  return NextResponse.json({ ok: true });
}
