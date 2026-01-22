import { pdf } from "@react-pdf/renderer";
import { WorkReportPDF, WorkReportPDFProps } from "../components/WorkReportPDF";
import { API_URL } from "@/config/env";

/**
 * Resolve S3 signature key to presigned URL for PDF generation
 */
async function resolveSignatureUrl(
  s3Key: string | null,
): Promise<string | null> {
  if (!s3Key) return null;

  // If already a data URL or http URL, return as-is (backward compatibility)
  if (s3Key.startsWith("data:") || s3Key.startsWith("http")) {
    return s3Key;
  }

  // If S3 key, fetch presigned URL
  if (s3Key.startsWith("signatures/")) {
    try {
      const response = await fetch(
        `${API_URL}/api/storage/signatures/${s3Key}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch presigned URL");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error resolving signature URL:", error);
      return null;
    }
  }

  return s3Key;
}

export const generateWorkReportPDF = async (
  data: WorkReportPDFProps["values"],
) => {
  try {
    // Resolve signature URL before generating PDF
    console.log("Resolving signature URL for PDF...");
    const resolvedSignature = await resolveSignatureUrl(
      data.firmaResponsable || null,
    );
    console.log("Resolved signature URL:", resolvedSignature);

    const pdfData = {
      ...data,
      firmaResponsable: resolvedSignature,
    };

    const blob = await pdf(<WorkReportPDF values={pdfData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const folio = data.folio || new Date().toISOString().split("T")[0];
    link.download = `reporte-trabajo-${folio}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error al generar el PDF");
  }
};
