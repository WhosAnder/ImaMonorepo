"use client";

import { WarehouseReportsListPage } from "@/features/almacen/views/WarehouseReportsListPage";
import { RequireRole } from "@/features/auth/components/RequireRole";

export default function Page() {
    return (
        <RequireRole allowedRoles={["admin", "warehouse"]}>
            <WarehouseReportsListPage />
        </RequireRole>
    );
}
