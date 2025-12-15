import { pdf } from "@react-pdf/renderer";
import { WarehouseReportPDF } from "../components/WarehouseReportPDF";
import { WarehouseReportFormValues } from "../schemas/warehouseReportSchema";

export const generatePDFReport = async (data: WarehouseReportFormValues) => {
  try {
    const blob = await pdf(<WarehouseReportPDF values={data} />).toBlob();
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
