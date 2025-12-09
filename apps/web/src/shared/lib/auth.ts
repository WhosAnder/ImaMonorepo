import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5001";
const AUTH_BASE_URL = baseUrl.endsWith("/auth") ? baseUrl : `${baseUrl}/auth`;

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [adminClient()],
});
