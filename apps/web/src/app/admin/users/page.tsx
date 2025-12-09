import { AppLayout } from "@/shared/layout/AppLayout";
import { UsersPage } from "@/features/admin/views/UsersPage";

export default function Page() {
  return (
    <AppLayout title="Gestión de Usuarios">
      <UsersPage />
    </AppLayout>
  );
}
