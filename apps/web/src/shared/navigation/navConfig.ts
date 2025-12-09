import type { UserRole } from "@/features/auth/types/roles";

type NavItem = {
  label: string;
  href: string;
};

type RoleNavConfig = {
  main: NavItem[];
};

export const navConfig: Record<UserRole, RoleNavConfig> = {
  admin: {
    main: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reportes de trabajo", href: "/reports" },
      { label: "Reportes de almacén", href: "/almacen" },
      { label: "Inventario", href: "/inventario" },
    ],
  },
  supervisor: {
    main: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reportes de trabajo", href: "/reports" },
    ],
  },
  warehouse: {
    main: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reportes de almacén", href: "/almacen" },
      { label: "Inventario", href: "/inventario" },
    ],
  },
};
