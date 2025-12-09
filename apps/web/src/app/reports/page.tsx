"use client";

import { ReportsListPage } from "@/features/reports/views/ReportsListPage";
import { RequireRole } from "@/features/auth/components/RequireRole";

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "supervisor"]}>
      <ReportsListPage />
    </RequireRole>
  );
}
