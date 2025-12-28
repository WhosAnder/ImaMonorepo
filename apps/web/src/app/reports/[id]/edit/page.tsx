"use client";

import { NewWorkReportPage } from "@/features/reports/views/NewWorkReportPage";
import { useParams } from "next/navigation";

export default function EditWorkReportPage() {
  const params = useParams();
  const id = params?.id as string;

  return <NewWorkReportPage reportId={id} />;
}
