import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateWorkerSchema, UpdateWorkerSchema } from "./workers.schema";
import {
  listWorkers,
  createWorker,
  updateWorker,
  deactivateWorker,
  permanentlyDeleteWorker,
} from "./workers.repository";
import { requireAdmin } from "../../middleware/requireAdmin";
import { ObjectId } from "mongodb";
import { getWorkersCollection } from "../../db/mongo";

const app = new Hono();

// Protect all routes with admin check
app.use("*", requireAdmin);

// GET /api/workers
app.get("/", async (c) => {
  const search = c.req.query("q");
  const includeInactive = c.req.query("includeInactive") === "true";
  const workers = await listWorkers(search, includeInactive);
  return c.json(workers);
});

// POST /api/workers
app.post("/", zValidator("json", CreateWorkerSchema), async (c) => {
  const body = c.req.valid("json");
  const worker = await createWorker(body.name);
  return c.json(worker, 201);
});

// PATCH /api/workers/:id
app.patch("/:id", zValidator("json", UpdateWorkerSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const worker = await updateWorker(id, body);
  if (!worker) {
    return c.json({ error: "Worker not found" }, 404);
  }
  return c.json(worker);
});

// PATCH /api/workers/:id/toggle - Toggle active status
app.patch("/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const collection = await getWorkersCollection();
  const worker = await collection.findOne({ _id: new ObjectId(id) });
  
  if (!worker) {
    return c.json({ error: "Worker not found" }, 404);
  }
  
  const updated = await updateWorker(id, { active: !worker.active });
  return c.json(updated);
});

// DELETE /api/workers/:id - Permanent delete
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const permanentParam = c.req.query("permanent");
  const permanent = permanentParam === "true";
  
  if (!permanent) {
    const errorMessage =
      permanentParam === null
        ? "Permanent delete requires the query parameter 'permanent=true'."
        : "Permanent delete is only allowed when 'permanent=true' is specified in the query string.";
    return c.json({ error: errorMessage }, 400);
  }
  
  const success = await permanentlyDeleteWorker(id);
  if (!success) {
    return c.json({ error: "Worker not found" }, 404);
  }
  
  return c.json({ message: "Worker permanently deleted" });
});

export const workersRoute = app;
