import { pdf } from "@react-pdf/renderer";
import { WarehouseReportPDF } from "../components/WarehouseReportPDF";
import { WarehouseReportFormValues } from "../schemas/warehouseReportSchema";
import { API_URL } from "@/config/env";

/**
 * Convert S3 signature key to presigned URL
 */
async function getSignatureUrl(
  key: string | null | undefined,
): Promise<string | null> {
  if (!key) return null;

  // Check if it's already a full URL (base64 or http/https)
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://")
  ) {
    return key;
  }

  // It's an S3 key, fetch presigned URL
  try {
    const response = await fetch(`${API_URL}/api/storage/signatures/${key}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (err) {
    console.error(`Failed to fetch signature URL:`, err);
    return null;
  }
}

export const generatePDFReport = async (data: WarehouseReportFormValues) => {
  try {
    // Convert S3 keys to presigned URLs for signatures
    const [firmaQuienRecibe, firmaAlmacenista, firmaQuienEntrega] =
      await Promise.all([
        getSignatureUrl(data.firmaQuienRecibe),
        getSignatureUrl(data.firmaAlmacenista),
        getSignatureUrl(data.firmaQuienEntrega),
      ]);

    // Create a copy of data with resolved URLs
    const dataWithUrls = {
      ...data,
      firmaQuienRecibe,
      firmaAlmacenista,
      firmaQuienEntrega,
    };

    const blob = await pdf(
      <WarehouseReportPDF values={dataWithUrls} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-almacen-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error al generar el PDF");
  }
};
