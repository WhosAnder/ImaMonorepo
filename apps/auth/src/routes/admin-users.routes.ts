import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import {
  applySetCookies,
  getSessionFromRequest,
  hasAdminRole,
  SessionUser,
} from "../lib/session";

const roleSchema = z.enum(["admin", "supervisor", "warehouse"]);

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  tempPassword: z.string().min(6),
});

const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: roleSchema.optional(),
    active: z.boolean().optional(),
    mustChangePassword: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

export const adminUsersRoute = new Hono<{ Variables: { adminUser: SessionUser } }>();

adminUsersRoute.use("*", async (c, next) => {
  const session = await getSessionFromRequest(c);
  applySetCookies(c, session.cookies);

  if (!session.user || !hasAdminRole(session.user.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  c.set("adminUser", session.user);
  await next();
});

adminUsersRoute.get("/users", async (c) => {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    })
    .from(users);

  return c.json(allUsers);
});

adminUsersRoute.post("/users", async (c) => {
  const body = await c.req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().formErrors.join(", ") }, 400);
  }

  const { name, email, role, tempPassword } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Email already exists" }, 400);
  }

  // Use BetterAuth to create user + account
  const signUpResponse = await auth.api
    .signUpEmail({
      body: { email, password: tempPassword, name },
      asResponse: true,
    })
    .catch(() => null);

  if (!signUpResponse || !signUpResponse.ok) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  // Get the created user and update role + mustChangePassword
  const [createdUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (createdUser) {
    await db
      .update(users)
      .set({ role, mustChangePassword: true })
      .where(eq(users.id, createdUser.id));
  }

  const [updated] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return c.json(updated, 201);
});

adminUsersRoute.patch("/users/:id", async (c) => {
  const userId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().formErrors.join(", ") }, 400);
  }

  const updates = parsed.data;
  const currentAdmin = c.get("adminUser");

  if (currentAdmin && currentAdmin.id === userId && updates.active === false) {
    return c.json({ error: "You cannot deactivate yourself" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    });

  if (!updated) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(updated);
});

adminUsersRoute.delete("/users/:id", async (c) => {
  const userId = c.req.param("id");
  const currentAdmin = c.get("adminUser");

  if (currentAdmin && currentAdmin.id === userId) {
    return c.json({ error: "You cannot remove yourself" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!updated) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ success: true });
});
