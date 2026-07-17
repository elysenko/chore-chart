// Request-scoped auth for App Router route handlers. Reads the Bearer token,
// verifies it, and loads the current user. Returns null when unauthenticated so
// callers can respond 401 without throwing.
import type { User } from '@prisma/client';
import { db } from './db';
import { verifyToken } from './auth';

/** Public shape of a member — never leak the password hash. */
export interface SafeMember {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  points: number;
  role: 'ADMIN' | 'USER';
}

export function toSafeMember(u: User): SafeMember {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarColor: u.avatarColor,
    points: u.points,
    role: u.role,
  };
}

function bearerFrom(req: Request): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/** Resolve the authenticated user for a request, or null. */
export async function getCurrentUser(req: Request): Promise<User | null> {
  const token = bearerFrom(req);
  if (!token) return null;
  const claims = verifyToken(token);
  if (!claims?.sub) return null;
  return db.user.findUnique({ where: { id: claims.sub } });
}
