import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { toSafeMember } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return NextResponse.json({ token, member: toSafeMember(user) });
}
