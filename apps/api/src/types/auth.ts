export type UserRole = "admin" | "supervisor" | "warehouse";

export interface RequestUser {
  id?: string;
  name?: string;
  role: UserRole;
}
