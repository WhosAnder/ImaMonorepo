export type UserRole = "admin" | "warehouse_admin" | "warehouse" | "user";

export interface RequestUser {
  id?: string;
  name?: string;
  role: UserRole;
}
