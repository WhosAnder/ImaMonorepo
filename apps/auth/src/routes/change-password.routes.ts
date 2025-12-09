import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../lib/auth";
import { getSessionFromRequest } from "../lib/session";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const changePasswordRoute = new Hono();

changePasswordRoute.post("/", async (c) => {
  const sessionResult = await getSessionFromRequest(c);
  if (!sessionResult.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().formErrors.join(", ") }, 400);
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = sessionResult.user.id;
  const email = sessionResult.user.email;

  // Verify current password by trying to sign in
  const signInResponse = await auth.api
    .signInEmail({
      body: { email, password: currentPassword },
      asResponse: true,
    })
    .catch(() => null);

  if (!signInResponse || !signInResponse.ok) {
    return c.json({ error: "Invalid current password" }, 400);
  }

  // Use BetterAuth admin API to set new password
  // This requires the admin plugin
  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: c.req.raw.headers,
    });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to change password" }, 500);
  }
});
