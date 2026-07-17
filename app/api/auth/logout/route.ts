import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// JWT auth is stateless — logout is a client-side token discard. This endpoint
// exists so the client has a single, explicit call to make.
export async function POST() {
  return NextResponse.json({ ok: true });
}
