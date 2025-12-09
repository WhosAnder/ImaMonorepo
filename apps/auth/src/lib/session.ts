import { Context } from "hono";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  email: string;
  role?: string | null;
  name?: string | null;
  active?: boolean | null;
  mustChangePassword?: boolean | null;
};

export type SessionResult = {
  user: SessionUser | null;
  session: unknown;
  cookies: string[];
};

export function collectSetCookies(response?: Response | null): string[] {
  if (!response) return [];
  const headerCookies = (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.();
  if (Array.isArray(headerCookies)) return headerCookies;

  const raw = headerCookies || response.headers.get("set-cookie");
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function applySetCookies(c: Context, cookies: string[]) {
  cookies.forEach((cookie) => {
    c.header("Set-Cookie", cookie, { append: true });
  });
}

export function hasAdminRole(role?: string | null) {
  if (!role) return false;
  return role
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes("admin");
}

export async function getSessionFromRequest(c: Context): Promise<SessionResult> {
  const response = await auth.api
    .getSession({
      request: c.req.raw,
      headers: c.req.raw.headers,
      asResponse: true,
    })
    .catch(() => null);

  const cookies = collectSetCookies(response);

  if (!response || !response.ok) {
    return { user: null, session: null, cookies };
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    user: (payload?.user as SessionUser) ?? null,
    session: payload?.session ?? null,
    cookies,
  };
}


