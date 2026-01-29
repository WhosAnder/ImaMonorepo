import { Context, Next } from "hono";
import { RequestUser, UserRole } from "../types/auth";

const CONTEXT_USER_KEY = "requestUser";
const VALID_ROLES: UserRole[] = ["admin", "supervisor", "warehouse"];
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

function normalizeRole(roleValue?: string | null): UserRole | null {
  if (!roleValue) return null;
  const roles = roleValue
    .split(",")
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);

  for (const role of VALID_ROLES) {
    if (roles.includes(role)) return role;
  }

  return null;
}

async function fetchSessionUser(c: Context): Promise<RequestUser | null> {
  const existing = c.get(CONTEXT_USER_KEY) as RequestUser | undefined;
  if (existing?.role) return existing;

  const cookieHeader = c.req.header("Cookie") || "";
  const response = await fetch(`${AUTH_SERVICE_URL}/auth/get-session`, {
    headers: {
      Cookie: cookieHeader,
    },
  }).catch(() => null);

  if (!response || !response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const sessionUser = payload?.user;
  const role = normalizeRole(sessionUser?.role);

  if (!sessionUser?.id || !role) {
    return null;
  }

  const user: RequestUser = {
    id: sessionUser.id,
    name: sessionUser.name || undefined,
    role,
  };

  c.set(CONTEXT_USER_KEY, user);
  return user;
}

export async function getRequestUser(c: Context): Promise<RequestUser | null> {
  return fetchSessionUser(c);
}

export function requireRole(roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = await fetchSessionUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}
