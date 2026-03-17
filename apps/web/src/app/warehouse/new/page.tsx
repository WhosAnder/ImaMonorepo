"use client";

import React from "react";
import { AppLayout } from "@/shared/layout/AppLayout";
import { NewWarehouseReportPage } from "@/features/warehouse/views/NewWarehouseReportPage";

export default function Page() {
  return (
    <AppLayout title="Nuevo Reporte de Almacén">
      <NewWarehouseReportPage />
    </AppLayout>
  );
}
