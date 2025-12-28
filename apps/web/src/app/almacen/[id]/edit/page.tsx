"use client";

import { NewWarehouseReportPage } from "@/features/almacen/views/NewWarehouseReportPage";
import { useParams } from "next/navigation";

export default function EditWarehouseReportPage() {
  const params = useParams();
  const id = params?.id as string;

  return <NewWarehouseReportPage reportId={id} />;
}
