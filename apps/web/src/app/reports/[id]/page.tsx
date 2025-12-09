"use client";

import { WorkReportDetailPage } from "@/features/reports/views/WorkReportDetailPage";
import { RequireRole } from "@/features/auth/components/RequireRole";

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "supervisor"]}>
      <WorkReportDetailPage />
    </RequireRole>
  );
}
