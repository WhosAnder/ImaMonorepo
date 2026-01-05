"use client";

import React from "react";
import { AppLayout } from "@/shared/layout/AppLayout";
import { NewWorkReportPage } from "@/features/reports/views/NewWorkReportPage";

export default function Page() {
  return (
    <AppLayout title="Nuevo Reporte de Trabajo">
      <NewWorkReportPage />
    </AppLayout>
  );
}
