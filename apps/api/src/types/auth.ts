export type UserRole = 'admin' | 'warehouse_admin' | 'user';

export interface RequestUser {
  id?: string;
  name?: string;
  role: UserRole;
}
