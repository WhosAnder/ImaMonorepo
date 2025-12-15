import { WarehouseReportFormValues } from "../schemas/warehouseReportSchema";
import { API_URL } from "@/config/env";
import { useRef } from "react";
// import genPDF from 'react-to-pdf';

interface CreateReportResponse {
  error?: string;
  data?: any;
}

export async function createReport(
  data: WarehouseReportFormValues,
): Promise<CreateReportResponse> {
  try {
    // TODO: remove this when the backend is updated
    // @ts-ignore
    data.tipoMantenimiento = "Entrega";

    const response = await fetch(`${API_URL}/api/warehouse-reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error creating report");
    }

    return { data: responseData };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
