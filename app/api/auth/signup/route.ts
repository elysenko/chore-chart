import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { toSafeMember } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Deterministic palette so new members get a distinct avatar color.
const PALETTE = ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316', '#e11d48', '#22c55e', '#eab308'];

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  // The first member to sign up becomes the household admin.
  const count = await db.user.count();
  const role = count === 0 ? 'ADMIN' : 'USER';
  const avatarColor = PALETTE[count % PALETTE.length];

  try {
    const user = await db.user.create({
      data: { name, email, password: await hashPassword(password), role, avatarColor },
    });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return NextResponse.json({ token, member: toSafeMember(user) }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    throw err;
  }
}
