import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Deep health check — verifies the database is reachable. Public (no auth).
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'error', db: 'down' }, { status: 503 });
  }
}
