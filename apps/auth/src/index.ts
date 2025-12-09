import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { router } from "./router";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

const port: number = Number(process.env.PORT || 5001);

// Middleware - must be applied before routes
app.use(logger());
app.use("*", cors({ 
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Routes
app.route("/", router);

serve({
  fetch: app.fetch,
  port
}).on('listening', () => {
  console.log(`[Auth] service running on http://127.0.0.1:${port}`);
});
