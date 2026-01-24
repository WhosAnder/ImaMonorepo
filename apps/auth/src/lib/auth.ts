import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "../db/client.js";
import { user, session, account, verification } from "../db/schema.js";

// Validate required environment variables
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

if (!BETTER_AUTH_SECRET) {
  console.error("[Auth] BETTER_AUTH_SECRET environment variable is required");
  console.error("[Auth] Please set BETTER_AUTH_SECRET in your Railway environment variables");
  console.error("[Auth] Generate a secure random string (at least 32 characters) for production");
  process.exit(1);
}

const authConfig: BetterAuthOptions = {
  secret: BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    schema: {
      user,
      session,
      account,
      verification,
    },
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: "warehouse",
      adminRoles: ["admin"],
    }),
  ],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5001",
  basePath: "/auth",
  trustedOrigins: ["http://localhost:3000", "http://localhost:5001"],
};

export const auth: ReturnType<typeof betterAuth> = betterAuth(authConfig);
