import { NextResponse } from 'next/server';
import { getCurrentUser, toSafeMember } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ member: toSafeMember(user) });
}
