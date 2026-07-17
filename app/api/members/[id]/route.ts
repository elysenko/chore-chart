import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, toSafeMember } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Profile + chore history for a single member. History is that member's
// assignments joined to their chore, most-recent week first.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const member = await db.user.findUnique({ where: { id } });
  if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

  const assignments = await db.assignment.findMany({
    where: { memberId: id },
    include: { chore: true },
    orderBy: [{ isoWeek: 'desc' }, { createdAt: 'desc' }],
  });

  const history = assignments.map((a) => ({
    id: a.id,
    isoWeek: a.isoWeek,
    completed: a.completed,
    completedAt: a.completedAt,
    chore: {
      id: a.chore.id,
      name: a.chore.name,
      pointValue: a.chore.pointValue,
      dueDay: a.chore.dueDay,
      rotationOffset: a.chore.rotationOffset,
    },
  }));

  return NextResponse.json({ member: toSafeMember(member), history });
}
