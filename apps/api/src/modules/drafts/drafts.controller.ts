import { Context } from "hono";
import { ZodError } from "zod";
import {
  upsertDraftForUser,
  getDraftForUser,
  deleteDraftForUser,
} from "./drafts.service";
import { getRequestUser } from "../../middleware/roleGuard";
import { DraftReportType } from "./drafts.types";

function toResponse(draft: any) {
  if (!draft) return null;
  const { _id, ...rest } = draft;
  return { id: _id?.toString(), ...rest };
}

export async function getDraftController(c: Context) {
  const user = await getRequestUser(c);
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const reportType = c.req.query("reportType") as DraftReportType | undefined;
  if (reportType !== "work" && reportType !== "warehouse") {
    return c.json({ error: "Invalid reportType" }, 400);
  }

  try {
    const draft = await getDraftForUser(user.id, reportType);
    if (!draft) return c.json({ error: "Draft not found" }, 404);
    return c.json(toResponse(draft));
  } catch (error) {
    console.error("Error fetching draft:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function upsertDraftController(c: Context) {
  const user = await getRequestUser(c);
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json();
    const draft = await upsertDraftForUser(user.id, body);
    return c.json(toResponse(draft));
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.issues }, 400);
    }
    console.error("Error upserting draft:", error);
    return c.json(
      { error: (error as Error).message || "Internal Server Error" },
      500,
    );
  }
}

export async function deleteDraftController(c: Context) {
  const user = await getRequestUser(c);
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const reportType = c.req.query("reportType") as DraftReportType | undefined;
  if (reportType !== "work" && reportType !== "warehouse") {
    return c.json({ error: "Invalid reportType" }, 400);
  }

  try {
    const deleted = await deleteDraftForUser(user.id, reportType);
    if (!deleted) return c.json({ error: "Draft not found" }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
