import { Hono } from "hono";
import { explorerListReports } from "./reports.explorer";

export const reportsRoute = new Hono();

/**
 * GET /api/reports-explorer/list
 * Lazy-load folder contents based on navigation path.
 * Query: type, subsystemSlug?, year?, month?, day?
 */
reportsRoute.get("/list", async (c) => {
  try {
    const type = c.req.query("type") as "work" | "warehouse";
    if (!type || (type !== "work" && type !== "warehouse")) {
      return c.json({ error: "Invalid report type" }, 400);
    }

    const yearStr = c.req.query("year");
    const monthStr = c.req.query("month");
    const dayStr = c.req.query("day");

    const params = {
      type,
      subsystemSlug: c.req.query("subsystemSlug") || undefined,
      year: yearStr ? parseInt(yearStr, 10) : undefined,
      month: monthStr ? parseInt(monthStr, 10) : undefined,
      day: dayStr ? parseInt(dayStr, 10) : undefined,
    };

    const result = await explorerListReports(params);
    return c.json(result);
  } catch (error) {
    console.error("Error in reports explorer list:", error);
    return c.json({ error: "Failed to list reports" }, 500);
  }
});
