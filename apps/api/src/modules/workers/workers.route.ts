import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateWorkerSchema, UpdateWorkerSchema } from "./workers.schema";
import {
  listWorkers,
  createWorker,
  updateWorker,
  deactivateWorker,
} from "./workers.repository";
import { requireAdmin } from "../../middleware/requireAdmin";

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

// DELETE /api/workers/:id (Soft delete)
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const worker = await deactivateWorker(id);
  if (!worker) {
    return c.json({ error: "Worker not found" }, 404);
  }
  return c.json(worker);
});

export const workersRoute = app;
