import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional().transform((val) => val || ""),
  role: z.enum(["admin", "supervisor", "warehouse"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
