# Chore Chart

A single-image full-stack household **Chore Chart**: a Next.js 15 (App Router)
SPA + REST API over PostgreSQL (Prisma), with JWT auth, weekly **rotating** chore
assignments, completion/points tracking, and a leaderboard.

## Stack

- **Frontend + API:** Next.js 15 (App Router). UI in `app/` + `components/`,
  REST API in `app/api/*`.
- **Database:** PostgreSQL via Prisma (`prisma/schema.prisma`).
- **Auth:** JWT (`jsonwebtoken`) + bcrypt password hashing (`bcryptjs`). Token
  stored client-side in `localStorage`, sent as `Authorization: Bearer <token>`.

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/chorechart"
JWT_SECRET="change-me-in-production"   # required in production
PORT=3000
```

## Develop / build / seed

```bash
npm install
npx prisma migrate deploy   # apply migrations
npm run build               # next build (standalone)
npx prisma db seed          # seed members + chores + this week's rotation
npm run dev                 # local dev server on :3000
```

The seed prints a single machine-parseable line:

```
SEED_CREDS_JSON {"accounts":[{"role":"ADMIN","email":"ava@chorechart.app","password":"password123"}, ...]}
```

**Demo login:** `ava@chorechart.app` / `password123` (all seeded members share
this password).

## Routes

### Pages
| Path | Description |
| --- | --- |
| `/login`, `/signup` | Public auth screens |
| `/` | Dashboard — "This Week's Chores" (reads `?week=YYYY-Www`) |
| `/members` | Household member grid |
| `/members/:id` | Member profile + chore history (deep-linkable) |
| `/leaderboard` | Points ranking |
| `/admin/settings` | Admin-only service settings |

### API
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | public | Email/password → `{ token, member }` |
| `POST` | `/api/auth/signup` | public | First user becomes `ADMIN` |
| `POST` | `/api/auth/logout` | public | Stateless no-op |
| `GET` | `/api/me` | bearer | Current member |
| `GET` | `/api/members` | bearer | All members |
| `GET` | `/api/members/:id` | bearer | Profile + chore history |
| `GET` | `/api/assignments?week=` | bearer | Week's rotation (defaults to current) |
| `POST` | `/api/assignments/:id/complete` | bearer | Assignee-only, idempotent, awards points |
| `GET` | `/api/leaderboard` | bearer | Members by points desc |
| `GET` | `/api/health` | public | Liveness |
| `GET` | `/api/health/deep` | public | Readiness (DB ping) |
| `GET`/`PATCH` | `/api/admin/settings` | admin | Runtime service settings |

## Rotation

Members are ordered by creation. For a chore in ISO week `W`:

```
assignee = members[(chore.rotationOffset + weekIndex(W)) % memberCount]
```

Assignments are materialized lazily the first time a week is requested and are
never reassigned afterward, so completion history stays stable. Note: deleting a
member shifts the assignee for weeks not yet materialized (acceptable for a demo).

## Notes

- `JWT_SECRET` must be provided via env in production.
- Seeds use upserts, so repeated container starts don't duplicate data.
