import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import type { UserRole } from "../types/roles";

type Props = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

export function RequireRole({ allowedRoles, children }: Props) {
  const { user } = useAuth();

  if (!user) return null; // Not logged in

  if (!allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="bg-red-50 text-red-800 px-6 py-4 rounded-lg border border-red-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-sm">
            No tienes acceso a esta sección con el rol actual ({user?.role}).
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
