import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import { db } from "../db/client";
import { user } from "../db/schema";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { applySetCookies, collectSetCookies } from "../lib/session";

const DEFAULT_ROLE = "warehouse";

export const authRoute = new Hono();

// Register using BetterAuth (creates user in user table + credential in account table)
authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().formErrors.join(", ") }, 400);
  }

  const { email, password, role, name } = parsed.data;

  // Check if email exists
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Email already registered" }, 400);
  }

  // Use BetterAuth to sign up (this creates user + account)
  const userName = String(name || email.split("@")[0]);
  const signUpResponse = await auth.api
    .signUpEmail({
      body: { email, password, name: userName },
      asResponse: true,
    })
    .catch(() => null);

  if (!signUpResponse || !signUpResponse.ok) {
    return c.json({ error: "Failed to register user" }, 500);
  }

  // Get the created user and update role
  const [createdUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (createdUser) {
    await db.update(user).set({ role: role || DEFAULT_ROLE }).where(eq(user.id, createdUser.id));
  }

  return c.json({ success: true }, 201);
});

// Login using BetterAuth
authRoute.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().formErrors.join(", ") }, 400);
  }

  const { email, password } = parsed.data;

  // Check if user exists and is not banned
  const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
  const found = result[0];

  if (!found) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  if (found.banned) {
    return c.json({ error: "User is banned" }, 403);
  }

  // Use BetterAuth to sign in
  const signInResponse = await auth.api
    .signInEmail({
      body: { email, password },
      asResponse: true,
    })
    .catch(() => null);

  const cookies = collectSetCookies(signInResponse);

  if (!signInResponse || !signInResponse.ok) {
    if (cookies.length) {
      applySetCookies(c, cookies);
    }
    return c.json({ error: "Invalid credentials" }, 401);
  }

  applySetCookies(c, cookies);

  return c.json({
    id: found.id,
    email: found.email,
    role: found.role || DEFAULT_ROLE,
    name: found.name,
  });
});

// Handle all remaining Better Auth routes (session, sign-out, admin, etc.)
authRoute.all("/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});
