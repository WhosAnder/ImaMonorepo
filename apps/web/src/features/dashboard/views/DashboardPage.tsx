import { useAuth } from "@/auth/AuthContext";
import { AdminDashboard } from "./AdminDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { WarehouseDashboard } from "./WarehouseDashboard";
import { AppLayout } from "@/shared/layout/AppLayout";

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  let content: React.ReactNode = null;

  if (user.role === "admin") {
    content = <AdminDashboard />;
  } else if (user.role === "supervisor") {
    content = <SupervisorDashboard />;
  } else if (user.role === "warehouse") {
    content = <WarehouseDashboard />;
  }

  return <AppLayout title="Dashboard">{content}</AppLayout>;
}
