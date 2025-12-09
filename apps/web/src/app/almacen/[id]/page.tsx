"use client";

import { WarehouseReportDetailPage } from "@/features/almacen/views/WarehouseReportDetailPage";
import { RequireRole } from "@/features/auth/components/RequireRole";

export default function Page() {
    return (
        <RequireRole allowedRoles={["admin", "warehouse"]}>
            <WarehouseReportDetailPage />
        </RequireRole>
    );
}
