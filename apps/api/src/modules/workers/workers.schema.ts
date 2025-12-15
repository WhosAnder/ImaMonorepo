import { z } from "zod";

export const CreateWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const UpdateWorkerSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});
