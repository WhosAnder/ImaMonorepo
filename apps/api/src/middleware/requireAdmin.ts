import { Context, Next } from "hono";

// ============================================================================
// AUTH TEMPORARILY DISABLED — bypass admin check
// Remove this bypass when auth migration is complete
// ============================================================================

export const requireAdmin = async (c: Context, next: Next) => {
  // Auth bypassed — always allow
  c.set("user", {
    id: c.req.header("x-user-id") || "dev-bypass",
    name: c.req.header("x-user-name") || "Dev User",
    role: "admin",
  });
  await next();
};
