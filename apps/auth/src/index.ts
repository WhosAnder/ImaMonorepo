// Conditional environment variable loading with debug logging
import { config } from 'dotenv';
import { join } from 'path';

// Only load .env in non-Railway environments (local development)
if (!process.env.RAILWAY_ENVIRONMENT) {
  config({ path: join(__dirname, '../../../apps/auth/.env') });
  console.log('Environment: Local development - loaded from .env file');
} else {
  console.log('Environment: Railway production - using injected variables');
}

// Debug logging for critical environment variables
console.log('Environment Variables Debug:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('   ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'not set');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
console.log('   BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || 'not set');

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { router } from "./router.js";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

const port: number = Number(process.env.PORT || 5001);

// Parse CORS allowed origins from environment variable
const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.ALLOWED_ORIGINS;
  
  if (!originsEnv) {
    console.warn("ALLOWED_ORIGINS not set, defaulting to http://localhost:3000");
    return ["http://localhost:3000"];
  }

  const origins = originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => {
      // Validate URL format
      try {
        new URL(origin);
        return true;
      } catch {
        console.warn(`Invalid origin URL: "${origin}" - skipping`);
        return false;
      }
    });

  if (origins.length === 0) {
    console.warn("No valid origins found in ALLOWED_ORIGINS, defaulting to http://localhost:3000");
    return ["http://localhost:3000"];
  }

  console.log(`CORS enabled for origins: ${origins.join(", ")}`);
  return origins;
};

// Middleware - must be applied before routes
app.use(logger());
app.use(
  "*",
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  }),
);

// Routes
app.route("/", router);

serve({
  fetch: app.fetch,
  port,
})
  .on("listening", () => {
    console.log(`[Auth] service running on http://127.0.0.1:${port}`);
  })
  .on("error", (err) => {
    console.error("[Auth] Server error:", err);
    process.exit(1);
  });
