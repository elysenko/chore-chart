// Weekly chore rotation. The assignee for a chore in a given ISO week is
// deterministic: members are ordered by creation, and
//   assignee = members[(chore.rotationOffset + weekIndex) % memberCount]
// Assignments are materialized lazily the first time a week is requested and
// are never reassigned afterward (so completed history stays stable).
import { db } from './db';
import { weekIndex } from './week';

/**
 * Ensure one Assignment row exists per chore for `isoWeek`.
 * Idempotent via the @@unique([choreId, isoWeek]) constraint — concurrent
 * callers race harmlessly and the loser's create is a no-op.
 */
export async function ensureWeekAssignments(isoWeek: string): Promise<void> {
  const [members, chores] = await Promise.all([
    db.user.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true } }),
    db.chore.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
  ]);

  if (members.length === 0 || chores.length === 0) return;

  const idx = weekIndex(isoWeek);
  const n = members.length;

  await Promise.all(
    chores.map((chore) => {
      const assignee = members[((chore.rotationOffset % n) + idx % n + n) % n];
      return db.assignment.upsert({
        where: { choreId_isoWeek: { choreId: chore.id, isoWeek } },
        // Never overwrite an already-materialized assignment (preserves
        // completion state and a stable assignee for the week).
        update: {},
        create: {
          choreId: chore.id,
          memberId: assignee.id,
          isoWeek,
          completed: false,
        },
      });
    }),
  );
}
