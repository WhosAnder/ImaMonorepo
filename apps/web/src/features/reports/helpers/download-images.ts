import { API_URL } from "@/config/env";
import {
  collectWorkReportEvidences,
  resolveWorkReportEvidenceUrl,
  WorkReportEvidenceItem,
} from "../utils/evidence";

interface Activity {
  evidencias?: WorkReportEvidenceItem[];
  nombre?: string;
}

/**
 * Download all evidence images from a work report
 * Downloads each image sequentially to avoid browser blocking
 */
export async function downloadReportImages(
  actividadesRealizadas: Activity[],
  folio: string
): Promise<void> {
  try {
    // Collect all evidence using the same utility as the gallery
    const allEvidences = collectWorkReportEvidences(actividadesRealizadas);

    if (allEvidences.length === 0) {
      alert("No hay imágenes para descargar");
      return;
    }

    // Show confirmation
    const confirmed = confirm(
      `Se descargarán ${allEvidences.length} imagen(es). ¿Continuar?`
    );
    if (!confirmed) return;

    // Resolve URLs and download each image
    for (let i = 0; i < allEvidences.length; i++) {
      const evidence = allEvidences[i];
      
      try {
        // Resolve the evidence URL (handles S3 keys, presigned URLs, etc.)
        const url = await resolveWorkReportEvidenceUrl(evidence);
        
        if (!url) {
          console.error(`No URL found for evidence ${i + 1}`);
          continue;
        }

        // Fetch image as blob
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        
        const blob = await response.blob();
        
        // Create descriptive filename
        const filename = `${folio}_evidencia_${i + 1}.jpg`;
        
        // Create download link
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        // Small delay between downloads
        if (i < allEvidences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Error downloading image ${i + 1}:`, error);
      }
    }

    alert(`Descarga completada: ${allEvidences.length} imagen(es)`);
  } catch (error) {
    console.error("Error downloading images:", error);
    alert("Error al descargar las imágenes");
  }
}
