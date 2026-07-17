# Pipeline Task Decomposition

## Summary
Chore Chart is a single-image full-stack app: a React + TypeScript SPA (React Router, deep-linkable routes) served by an Express + TypeScript API over Prisma/SQLite. Members sign in with JWT auth, see weekly rotating chore assignments, mark their own chores complete to earn points, and view a leaderboard. Assignments rotate weekly via a deterministic formula and are materialized lazily per ISO week. A seed creates demo members and chores and prints a machine-parseable `SEED_CREDS_JSON` line.

## Surface contract
**Public API routes (no auth):**
- `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`
- `GET /api/health`, `GET /api/health/deep`

**Authenticated API routes (Bearer JWT):**
- `GET /api/me`
- `GET /api/members`, `GET /api/members/:id` (profile + chore history)
- `GET /api/assignments?week=<ISO>` (defaults to current ISO week), `POST /api/assignments/:id/complete`
- `GET /api/leaderboard`

**Admin API routes (admin role, present because backing services are provisioned):**
- `GET /api/admin/settings`, `PATCH /api/admin/settings`

**Client routes:**
- Public: `/login`, `/signup`
- Guarded: `/` (Dashboard "This Week", reads `?week=`), `/members`, `/members/:id`, `/leaderboard`
- Admin: `/admin/settings`

**Entities:** `Member` (id, name, email unique, passwordHash, avatarColor, points, role), `Chore` (id, name, pointValue, dueDay 0–6, rotationOffset), `Assignment` (id, choreId, memberId, isoWeek, completed, completedAt; unique [choreId, isoWeek]), `SystemSetting` (key, value, updatedAt).

## db_agent tasks
- [ ] Create `prisma/schema.prisma` with SQLite datasource and Prisma client generator (`DATABASE_URL="file:./data/chore.db"`).
- [ ] Add `enum UserRole { ADMIN USER }` and define `Member` model per spec (`id Int @id @default(autoincrement())`, `name`, `email @unique`, `passwordHash`, `avatarColor`, `points Int @default(0)`, `role UserRole @default(USER)`, `assignments Assignment[]`). Member is the User/auth entity.
- [ ] Define `Chore` model (`id`, `name`, `pointValue Int`, `dueDay Int` (0–6), `rotationOffset Int`, `assignments Assignment[]`).
- [ ] Define `Assignment` model (`id`, `choreId`, `memberId`, `isoWeek String`, `completed Boolean @default(false)`, `completedAt DateTime?`, relations, `@@unique([choreId, isoWeek])`).
- [ ] Add `SystemSetting` model (`key String @id`, `value String`, `updatedAt DateTime @updatedAt`) to back admin settings for the provisioned services.
- [ ] Generate the initial Prisma migration and ensure `prisma migrate deploy` works from a clean database.

## backend_agent tasks
- [ ] Create `src/server/db.ts` — Prisma client singleton.
- [ ] Create `src/server/auth.ts` — `hashPassword`/`verifyPassword` (bcryptjs), `signToken`/`verifyToken` (jsonwebtoken, fail fast if `JWT_SECRET` unset), and `requireAuth` middleware that reads the `Authorization: Bearer` token and attaches `req.member`.
- [ ] Add an admin guard middleware (`requireAdmin`) that checks `req.member.role === ADMIN`; used to protect the `/api/admin/*` route group.
- [ ] Create `src/server/routes/auth.ts` — `POST /login` (verify creds → token + safe member), `POST /signup` (first user gets `ADMIN` role, subsequent users get `USER`; hash password), `POST /logout` (stateless no-op), `GET /me`. Never return `passwordHash`.
- [ ] Create `src/server/week.ts` — `currentIsoWeek()`, `parseIsoWeek(str)`, `weekIndex(isoWeek)`, handling year-boundary/week-53 edge cases.
- [ ] Create `src/server/rotation.ts` — `ensureWeekAssignments(isoWeek)` computing assignee per chore via `(chore.rotationOffset + weekIndex) % memberCount` over members ordered by `id`, upserting `Assignment` rows idempotently.
- [ ] Create `src/server/routes/members.ts` (behind `requireAuth`) — `GET /members` (name, avatarColor, points), `GET /members/:id` (profile + chore history joined to chores, ordered by week).
- [ ] Create `src/server/routes/assignments.ts` (behind `requireAuth`) — `GET /assignments?week=` (defaults to current ISO week, calls `ensureWeekAssignments`, returns chores with assignee + dueDay + completed); `POST /assignments/:id/complete` (only assignee, transactional set completed/completedAt + increment points, idempotent — no double count, reject non-assignee).
- [ ] Create `src/server/routes/leaderboard.ts` (behind `requireAuth`) — `GET /leaderboard` returning members ordered by points desc.
- [ ] Create `src/server/routes/health.ts` — `GET /health` (`{status:'ok'}`) and `GET /health/deep` (trivial DB ping); both public.
- [ ] Create `src/server/lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or is absent, reads from a `SystemSetting` DB row; returns null if neither is set.
- [ ] Create `src/server/routes/admin/settings.ts` — `GET /api/admin/settings` (lists postgresql + minio service keys with masked values and configured status) and `PATCH /api/admin/settings` (upsert key-value pairs; admin role required). Mount behind `requireAuth` + `requireAdmin`.
- [ ] Create `src/server/index.ts` — Express app: JSON middleware, mount `/api/*` routers, serve static `dist/client`, SPA fallback to `index.html` for non-API routes, listen on `PORT`.

## ui_agent tasks
- [ ] Create `src/client/index.html`, `main.tsx`, `App.tsx` (React Router + `AuthProvider`), and `index.css`.
- [ ] Create `src/client/auth/AuthContext.tsx` — persists JWT in `localStorage`, exposes `login/logout/me` and current member (with role).
- [ ] Create `src/client/auth/RequireAuth.tsx` — guard redirecting unauthenticated users to `/login`.
- [ ] Create `src/client/components/Layout.tsx` — nav + logout; show an Admin link (to `/admin/settings`) only when the current member's role is `ADMIN`.
- [ ] Create `pages/Login.tsx` and `pages/Signup.tsx` as part of the main app (public routes), with empty/loading/error states.
- [ ] Create `pages/Dashboard.tsx` — renders a "This Week" heading, reads `?week=` via `useSearchParams`, lists chore → assignee → due day (weekday name); own assigned+incomplete chores show a "Mark complete" button; handle loading/empty/error.
- [ ] Create `pages/Members.tsx` — grid of members (name, avatar color swatch, points) with empty/loading states.
- [ ] Create `pages/MemberDetail.tsx` (`/members/:id`) — route-addressable profile + chore history rendered without click-through.
- [ ] Create `pages/Leaderboard.tsx` — ranked list ordered by points.
- [ ] Create `pages/admin/Settings.tsx` at `/admin/settings` — lists each provisioned service (postgresql, minio) with a configured/unconfigured badge and per-service credential form (PATCHes `/api/admin/settings`). No placeholder-services banner is required since `<placeholder_services>` is empty.

## service_agent tasks
- [ ] Create `src/client/api.ts` — fetch wrapper that attaches `Authorization: Bearer` from the auth context/localStorage and centralizes JSON parsing + error handling.
- [ ] Wire auth pages/context to `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /api/me`.
- [ ] Wire Dashboard to `GET /api/assignments?week=` and `POST /api/assignments/:id/complete`, refetching after completion.
- [ ] Wire Members/MemberDetail to `GET /api/members` and `GET /api/members/:id`, and Leaderboard to `GET /api/leaderboard`.
- [ ] Wire the admin settings page to `GET /api/admin/settings` and `PATCH /api/admin/settings`.

## tester tasks
- [ ] Auth: login with a seeded credential returns a token; a guarded API route without a token returns 401 and the SPA redirects to `/login`.
- [ ] Dashboard: `/` shows "This Week" with populated assignments after seed; `?week=<ISO>` renders that week's rotation; assignees differ across adjacent weeks (rotation advances).
- [ ] Members: `/members` lists 4+ members; direct navigation to `/members/:id` renders profile + history without click-through.
- [ ] Completion/points: marking own chore complete flips it to done and raises that member's points; repeat call does not double-count; a non-assignee is rejected.
- [ ] Leaderboard: ordering reflects points after completions.
- [ ] Seed: stdout contains a single machine-parseable `SEED_CREDS_JSON` line; `JSON.parse` of the payload succeeds with ≥2 accounts.
- [ ] Health: `/api/health` and `/api/health/deep` return 200 unauthenticated.
- [ ] Admin settings: non-admin is rejected from `GET/PATCH /api/admin/settings`; admin can read masked service status and upsert credentials.

## Open questions
- The spec declares **Integrations: None**, but `<spec_deployments>` lists `postgresql` and `minio` while the data layer is Prisma/SQLite. These backing services are not referenced anywhere in the spec's models, routes, or scenarios. Admin settings scaffolding (SystemSetting, `lib/config.ts`, `/api/admin/settings`, `/admin/settings` page) has been added per pipeline rules, but the actual runtime use of postgresql/minio is undefined — downstream agents should confirm whether these should be wired to real behaviour or left as configurable-but-unused placeholders.
- Spec's `## Auth` narrative uses an `isAdmin Boolean` flag on Member, while the pipeline auth model requires a `role UserRole` enum. Tasks use the `role` enum (first signup → ADMIN, others → USER) as the source of truth; db_agent should not also add a redundant `isAdmin` column.
- Route path prefixes for auth (`/api/auth/login` vs `/api/login`) are assumed from the router file layout; backend_agent should keep client `api.ts` and server mounts consistent.
