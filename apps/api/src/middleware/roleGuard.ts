import { Context, Next } from "hono";
import { RequestUser, UserRole } from "../types/auth";

const CONTEXT_USER_KEY = "requestUser";

// ============================================================================
// AUTH TEMPORARILY DISABLED — bypass all role checks
// Remove this bypass when auth migration is complete
// ============================================================================

const BYPASS_USER: RequestUser = {
  id: "dev-bypass",
  name: "Dev User",
  role: "admin",
};

export async function getRequestUser(c: Context): Promise<RequestUser | null> {
  // Return bypass user — no session validation
  const existing = c.get(CONTEXT_USER_KEY) as RequestUser | undefined;
  if (existing?.role) return existing;

  // Try to read user info from headers (sent by gateway/frontend)
  const userId = c.req.header("x-user-id");
  const userName = c.req.header("x-user-name");
  const userRole = c.req.header("x-user-role") as UserRole | undefined;

  const user: RequestUser = {
    id: userId || BYPASS_USER.id,
    name: userName || BYPASS_USER.name,
    role: userRole || BYPASS_USER.role,
  };

  c.set(CONTEXT_USER_KEY, user);
  return user;
}

export function requireRole(_roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    // Auth bypassed — always allow
    const user = await getRequestUser(c);
    c.set(CONTEXT_USER_KEY, user);
    await next();
  };
}
