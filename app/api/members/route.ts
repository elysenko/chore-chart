import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, toSafeMember } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const members = await db.user.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return NextResponse.json({ members: members.map(toSafeMember) });
}
