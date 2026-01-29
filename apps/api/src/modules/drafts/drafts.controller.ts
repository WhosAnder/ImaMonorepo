import { Context } from "hono";
import { ZodError } from "zod";
import {
  createOrUpdateDraftByUser,
  deleteDraft,
  getDraftByUserAndType,
  updateDraft,
} from "./drafts.service";
import { getRequestUser } from "../../middleware/roleGuard";

function mapDraftToResponse(draft: any) {
  const { _id, ...rest } = draft;
  return {
    id: _id?.toString(),
    ...rest,
  };
}

export async function getDraftController(c: Context) {
  const reportType = c.req.query("reportType");
  const user = await getRequestUser(c);

  if (!user || !user.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (reportType !== "work" && reportType !== "warehouse") {
    return c.json({ error: "Invalid reportType" }, 400);
  }

  try {
    const draft = await getDraftByUserAndType(user.id, reportType);
    if (!draft) {
      return c.json({ error: "Draft not found" }, 404);
    }
    return c.json(mapDraftToResponse(draft));
  } catch (error) {
    console.error("Error fetching draft:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function createDraftController(c: Context) {
  const user = await getRequestUser(c);
  if (!user || !user.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const draft = await createOrUpdateDraftByUser(user, body);
    return c.json(mapDraftToResponse(draft), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.issues }, 400);
    }
    console.error("Error creating draft:", error);
    return c.json({ error: (error as Error).message || "Internal Server Error" }, 500);
  }
}

export async function updateDraftController(c: Context) {
  const user = await getRequestUser(c);
  if (!user || !user.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const draft = await updateDraft(user, id, body);
    if (!draft) {
      return c.json({ error: "Draft not found" }, 404);
    }
    return c.json(mapDraftToResponse(draft));
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.issues }, 400);
    }
    console.error("Error updating draft:", error);
    return c.json({ error: (error as Error).message || "Internal Server Error" }, 500);
  }
}

export async function deleteDraftController(c: Context) {
  const user = await getRequestUser(c);
  if (!user || !user.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  try {
    const deleted = await deleteDraft(user, id);
    if (!deleted) {
      return c.json({ error: "Draft not found" }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
