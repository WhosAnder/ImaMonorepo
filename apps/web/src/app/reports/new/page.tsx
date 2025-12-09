"use client";

import { AppLayout } from "@/shared/layout/AppLayout";
import { NewWorkReportPage } from "@/features/reports/views/NewWorkReportPage";

export default function NewReportPage() {
  return (
    <AppLayout title="Nuevo reporte">
      <NewWorkReportPage />
    </AppLayout>
  );
}
