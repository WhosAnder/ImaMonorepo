import JSZip from "jszip";
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
 * Download all evidence images from a work report as a ZIP file
 * Bundles all images into a single ZIP to avoid browser blocking
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
      `Se descargarán ${allEvidences.length} imagen(es) en un archivo ZIP. ¿Continuar?`
    );
    if (!confirmed) return;

    // Create ZIP file
    const zip = new JSZip();
    let successCount = 0;

    // Fetch and add each image to ZIP
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
        
        // Add to ZIP with descriptive filename
        const filename = `evidencia_${i + 1}.jpg`;
        zip.file(filename, blob);
        successCount++;
      } catch (error) {
        console.error(`Error fetching image ${i + 1}:`, error);
      }
    }

    if (successCount === 0) {
      alert("No se pudo descargar ninguna imagen");
      return;
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    // Download ZIP file
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${folio}_evidencias.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    alert(`Descarga completada: ${successCount} imagen(es) en archivo ZIP`);
  } catch (error) {
    console.error("Error downloading images:", error);
    alert("Error al descargar las imágenes");
  }
}
