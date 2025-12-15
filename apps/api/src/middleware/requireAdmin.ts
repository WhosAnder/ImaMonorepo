import { Context, Next } from "hono";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

export const requireAdmin = async (c: Context, next: Next) => {
  try {
    const cookieHeader = c.req.header("Cookie");
    
    // Call auth service to validate session
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/get-session`, {
      headers: {
        Cookie: cookieHeader || "",
      },
    });

    if (!res.ok) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const data = await res.json();
    const user = data?.user;

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check for admin role
    // Role can be a comma-separated string or a single string
    const roles = (user.role || "").split(",").map((r: string) => r.trim());
    
    if (!roles.includes("admin")) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    // Attach user to context if needed (optional, but good practice)
    c.set("user", user);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
