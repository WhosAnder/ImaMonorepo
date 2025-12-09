import { Context, Next } from 'hono';
import { RequestUser, UserRole } from '../types/auth';

const CONTEXT_USER_KEY = 'requestUser';
const VALID_ROLES: UserRole[] = ['admin', 'warehouse_admin', 'user'];

function parseRole(roleHeader?: string | null): UserRole {
  if (!roleHeader) {
    return 'user';
  }
  const normalized = roleHeader.toLowerCase();
  const matched = VALID_ROLES.find((role) => role === normalized);
  return matched ?? 'user';
}

export function resolveUserFromRequest(c: Context): RequestUser {
  const existing = c.get<RequestUser | undefined>(CONTEXT_USER_KEY);
  if (existing) {
    return existing;
  }

  const role = parseRole(c.req.header('x-user-role'));
  const user: RequestUser = {
    id: c.req.header('x-user-id') || undefined,
    name: c.req.header('x-user-name') || undefined,
    role,
  };

  c.set(CONTEXT_USER_KEY, user);
  return user;
}

export function getRequestUser(c: Context): RequestUser {
  return resolveUserFromRequest(c);
}

export function requireRole(roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = resolveUserFromRequest(c);
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}
