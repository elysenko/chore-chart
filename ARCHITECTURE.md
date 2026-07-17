# Architecture

## Requested stack
`nextjs-fullstack` — fixed by the platform at app creation. The technical plan
(chore chart app) describes a React+Express+SQLite shape, but per the stack
contract the platform's chosen stack overrides that; the plan's *features*
are implemented on top of this Next.js scaffold instead.

## What was scaffolded
- ⏭️ nothing pre-existed — the project directory only contained a stub
  `README.md`. This is a fresh, greenfield scaffold.
- ✅ `nextjs-fullstack` scaffolded from `template-nextjs-fullstack` directly
  into the project root (single-image app: Next.js App Router serves both
  the UI and the API routes — no separate backend service).

## Where things live
- `app/` — Next.js App Router pages and layouts (`app/page.tsx`, `app/layout.tsx`).
- `app/api/` — API routes acting as the backend (`app/api/health/route.ts` is the
  only route so far; add more `route.ts` files under `app/api/**`).
- `lib/auth.ts` — JWT session helpers (`signToken` / `verifyToken`), `auth_pattern: jwt_session`.
- `prisma/schema.prisma` — Prisma schema, **PostgreSQL** datasource (not SQLite —
  the plan's SQLite assumption does not apply to this stack).
- `prisma/seed.ts` — seed script; prints `SEED_CRED <ROLE> <email> <password>`
  lines and a final `SEED_CREDS_JSON {...}` line (Colossus seed-credential contract).
- `public/` — static assets.
- `Dockerfile` — multi-stage build, `next build` with `output: 'standalone'`,
  final image runs `node server.js`.
- `.pipeline/surface.json` — machine-readable route/component/testid manifest
  consumed by the coder and Playwright test generator. Regenerate/extend it as
  routes, components, and `data-testid`s are added.
- `.colossus-acceptance.json` — post-deploy render-gate contract
  (`ready_testid`, `expect_text`, `reject_signatures`). The coder must fill in
  `expect_text` once the real front page exists.
- `colossus.yaml` — build manifest read by deploy agents (`framework: nextjs`,
  standalone output, port 3000, no nginx needed).

## Next steps for the developer / coder agent
1. Copy `.env.example` to `.env` (already done: a `.env` was created)
   and point `DATABASE_URL` at a real Postgres instance; set a real `JWT_SECRET`.
2. `npm install`
3. `npx prisma migrate dev` (create the initial migration — no migration has
   been run yet) to create the `User` table, then extend `prisma/schema.prisma`
   with the plan's `Member`/`Chore`/`Assignment` models (adapt `Member` to the
   existing `User` model or add new models alongside it — do not remove the
   `User` model without checking `lib/auth.ts` usage).
4. `npm run dev` to run locally (`next dev`).
5. Implement the chore-chart features (weekly rotation, completion/points,
   leaderboard, member pages) as Next.js pages under `app/` and API routes
   under `app/api/`, reusing `lib/auth.ts` for JWT auth instead of the plan's
   Express middleware.
6. `npx prisma db seed` (or `npm run seed` if added) to seed demo data; verify
   stdout contains a `SEED_CREDS_JSON` line.
7. Update `.pipeline/surface.json` and `.colossus-acceptance.json` as real
   routes, components, and testids are added.
8. Replace the stub `README.md` with real run/build/seed instructions and a
   route list.

## Template source
- `template-nextjs-fullstack` from the scaffold-templates directory.
