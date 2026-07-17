// Seed contract (Colossus): every seeded demo credential MUST be printed as a
// `SEED_CRED <ROLE> <email> <password>` line AND a single SEED_CREDS_JSON line —
// the deploy activity sync_seed_credentials parses stdout to populate
// deployments.appDemoCredentials. Keep these lines when extending this seed.
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Every seeded member shares this demo password so the login screen's hint
// (ava@chorechart.app / password123) works out of the box.
const DEMO_PASSWORD = 'password123';

const SEED_MEMBERS: Array<{ email: string; name: string; role: Role; avatarColor: string }> = [
  { email: 'ava@chorechart.app', name: 'Ava Thompson', role: Role.ADMIN, avatarColor: '#6366f1' },
  { email: 'liam@chorechart.app', name: 'Liam Chen', role: Role.USER, avatarColor: '#10b981' },
  { email: 'maya@chorechart.app', name: 'Maya Patel', role: Role.USER, avatarColor: '#f59e0b' },
  { email: 'noah@chorechart.app', name: 'Noah Garcia', role: Role.USER, avatarColor: '#ef4444' },
  { email: 'sofia@chorechart.app', name: 'Sofia Rossi', role: Role.USER, avatarColor: '#ec4899' },
];

// Explicit ids make the chore upserts idempotent across repeated container starts.
const SEED_CHORES = [
  { id: 'chore-trash', name: 'Take out the trash', pointValue: 5, dueDay: 1, rotationOffset: 0 },
  { id: 'chore-dishes', name: 'Wash the dishes', pointValue: 3, dueDay: 2, rotationOffset: 1 },
  { id: 'chore-vacuum', name: 'Vacuum living room', pointValue: 4, dueDay: 3, rotationOffset: 2 },
  { id: 'chore-bathroom', name: 'Clean the bathroom', pointValue: 6, dueDay: 4, rotationOffset: 3 },
  { id: 'chore-lawn', name: 'Mow the lawn', pointValue: 8, dueDay: 5, rotationOffset: 4 },
  { id: 'chore-laundry', name: 'Fold the laundry', pointValue: 4, dueDay: 6, rotationOffset: 5 },
];

const WEEK_MS = 7 * 86400000;

function isoWeekString(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const fdn = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdn + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / WEEK_MS);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function mondayOfIsoWeek(iso: string): Date {
  const [y, w] = iso.split('-W');
  const simple = new Date(Date.UTC(Number(y), 0, 4));
  const dayNum = (simple.getUTCDay() + 6) % 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dayNum + (Number(w) - 1) * 7);
  return monday;
}

function weekIndex(iso: string): number {
  return Math.floor(mondayOfIsoWeek(iso).getTime() / WEEK_MS);
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const creds: Array<{ role: string; email: string; password: string }> = [];

  for (const m of SEED_MEMBERS) {
    await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, role: m.role, avatarColor: m.avatarColor, password: passwordHash },
      create: { email: m.email, name: m.name, role: m.role, avatarColor: m.avatarColor, password: passwordHash },
    });
    console.log(`SEED_CRED ${m.role} ${m.email} ${DEMO_PASSWORD}`);
    creds.push({ role: m.role, email: m.email, password: DEMO_PASSWORD });
  }

  for (const c of SEED_CHORES) {
    await prisma.chore.upsert({
      where: { id: c.id },
      update: { name: c.name, pointValue: c.pointValue, dueDay: c.dueDay, rotationOffset: c.rotationOffset },
      create: c,
    });
  }

  // Materialize the current ISO week's rotation so the dashboard is populated
  // immediately after deploy. assignee = members[(offset + weekIndex) % count].
  const isoWeek = isoWeekString(new Date());
  const members = await prisma.user.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true } });
  const chores = await prisma.chore.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const idx = weekIndex(isoWeek);
  const n = members.length;

  for (const chore of chores) {
    const assignee = members[(((chore.rotationOffset % n) + (idx % n)) + n) % n];
    await prisma.assignment.upsert({
      where: { choreId_isoWeek: { choreId: chore.id, isoWeek } },
      update: {},
      create: { choreId: chore.id, memberId: assignee.id, isoWeek, completed: false },
    });
  }

  console.log(`SEED_CREDS_JSON ${JSON.stringify({ accounts: creds })}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
