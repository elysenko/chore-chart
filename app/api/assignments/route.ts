import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, toSafeMember } from '@/lib/session';
import { currentIsoWeek, parseIsoWeek } from '@/lib/week';
import { ensureWeekAssignments } from '@/lib/rotation';

export const dynamic = 'force-dynamic';

// GET /api/assignments?week=YYYY-Www
// Defaults to the current ISO week. Materializes the week's rotation on demand,
// then returns each chore with its assignee, due day and completion state.
export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const week = parseIsoWeek(searchParams.get('week')) ?? currentIsoWeek();

  await ensureWeekAssignments(week);

  const assignments = await db.assignment.findMany({
    where: { isoWeek: week },
    include: { chore: true, member: true },
    orderBy: [{ chore: { dueDay: 'asc' } }, { chore: { createdAt: 'asc' } }],
  });

  const rows = assignments.map((a) => ({
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
    member: toSafeMember(a.member),
  }));

  return NextResponse.json({ week, assignments: rows });
}
