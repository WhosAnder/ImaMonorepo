export type UserRole = "admin" | "supervisor" | "warehouse";

export type CurrentUser = {
  id: string;
  name: string;
  role: UserRole;
  area?: string; // e.g. "vía de la guía", can be used later for filtering
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  warehouse: "Almacenista",
};

