import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "../db/client.js";
import { user, session, account, verification } from "../db/schema.js";

// Validate required environment variables
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

if (!BETTER_AUTH_SECRET) {
  console.error("[Auth] BETTER_AUTH_SECRET environment variable is required");
  process.exit(1);
}

if (BETTER_AUTH_SECRET.length < 32) {
  console.error("[Auth] BETTER_AUTH_SECRET must be at least 32 characters long for adequate security");
  console.error(`[Auth] Current length: ${BETTER_AUTH_SECRET.length} characters`);
  process.exit(1);
}

/**
 * Extract cookie domain from a base URL for cross-subdomain cookie sharing
 * Examples:
 * - https://auth.railway.app -> .railway.app
 * - https://auth.domain.com -> .domain.com
 * - http://localhost:5001 -> undefined (no domain for localhost)
 */
function getCookieDomain(baseUrl: string): string | undefined {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    
    // Don't set domain for localhost or IP addresses
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return undefined;
    }
    
    // Extract parent domain for subdomains
    // auth.railway.app -> .railway.app
    // api.domain.com -> .domain.com
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.');
    }
    
    return undefined;
  } catch (error) {
    console.warn(`[Auth] Failed to parse cookie domain from: ${baseUrl}`, error);
    return undefined;
  }
}

/**
 * Parse trusted origins from ALLOWED_ORIGINS environment variable
 * Falls back to localhost URLs if not set
 */
function getTrustedOrigins(): string[] {
  const originsEnv = process.env.ALLOWED_ORIGINS;
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:5001";
  
  const defaultOrigins = ["http://localhost:3000", "http://localhost:5001"];
  
  if (!originsEnv) {
    console.log("[Auth] ALLOWED_ORIGINS not set, using default localhost origins");
    return defaultOrigins;
  }

  const origins = originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => {
      try {
        new URL(origin);
        return true;
      } catch {
        console.warn(`[Auth] Invalid origin URL: "${origin}" - skipping`);
        return false;
      }
    });

  // Always include the auth service's own base URL
  if (!origins.includes(baseUrl)) {
    origins.push(baseUrl);
  }

  console.log(`[Auth] Trusted origins configured: ${origins.join(", ")}`);
  return origins.length > 0 ? origins : defaultOrigins;
}

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:5001";
const isHttps = baseURL.startsWith("https://");

// Determine cookie domain (can be explicitly set or auto-detected)
const cookieDomain = process.env.COOKIE_DOMAIN || getCookieDomain(baseURL);

const cookieAttributes = isHttps
  ? {
      secure: true,
      sameSite: "none" as const,
      httpOnly: true,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    }
  : {
      secure: false,
      sameSite: "lax" as const,
      httpOnly: true,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };

const advancedConfig: any = {
  cookies: {
    session_token: {
      attributes: cookieAttributes,
    },
  },
  useSecureCookies: isHttps,
};

if (cookieDomain) {
  advancedConfig.crossSubDomainCookies = {
    enabled: true,
    domain: cookieDomain,
  };
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
  baseURL,
  basePath: "/auth",
  advanced: advancedConfig,
  trustedOrigins: getTrustedOrigins(),
};

export const auth: ReturnType<typeof betterAuth> = betterAuth(authConfig);
