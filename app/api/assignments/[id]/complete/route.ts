import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// POST /api/assignments/:id/complete
// Only the assignee may complete their chore. Completion is idempotent: points
// are awarded exactly once, guarded inside a transaction by the `completed` flag.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const result = await db.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id },
        include: { chore: true },
      });
      if (!assignment) return { status: 404 as const, body: { error: 'Assignment not found.' } };
      if (assignment.memberId !== user.id) {
        return { status: 403 as const, body: { error: 'This chore is not assigned to you.' } };
      }

      if (assignment.completed) {
        // Already done — no double-count.
        return { status: 200 as const, body: { assignment: serialize(assignment), awarded: 0 } };
      }

      const updated = await tx.assignment.update({
        where: { id },
        data: { completed: true, completedAt: new Date() },
        include: { chore: true },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: assignment.chore.pointValue } },
      });

      return {
        status: 200 as const,
        body: { assignment: serialize(updated), awarded: assignment.chore.pointValue },
      };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'Could not complete chore.' }, { status: 500 });
  }
}

function serialize(a: {
  id: string;
  isoWeek: string;
  completed: boolean;
  completedAt: Date | null;
  chore: { id: string; name: string; pointValue: number; dueDay: number; rotationOffset: number };
}) {
  return {
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
  };
}
