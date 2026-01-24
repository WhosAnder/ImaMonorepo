import { Hono } from "hono";
import { authRoute } from "./routes/auth.routes.js";
import { changePasswordRoute } from "./routes/change-password.routes.js";

export const router = new Hono();

router.get("/health", (c) => c.json({ ok: true, service: "auth" }));

// Change password route (custom)
router.route("/auth/change-password", changePasswordRoute);

// Auth routes (includes BetterAuth handler with admin plugin)
router.route("/auth", authRoute);
