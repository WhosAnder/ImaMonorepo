import { API_URL } from "@/config/env";

interface Evidence {
  s3Key?: string;
  url?: string;
  uploadedAt?: Date;
}

interface Activity {
  evidencias?: Evidence[];
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
    // Collect all evidence URLs
    const allEvidences: { url: string; filename: string }[] = [];
    
    actividadesRealizadas.forEach((actividad, actIndex) => {
      if (actividad.evidencias && actividad.evidencias.length > 0) {
        actividad.evidencias.forEach((evidencia, evIndex) => {
          if (evidencia.url) {
            // Create descriptive filename
            const activityName = actividad.nombre
              ? actividad.nombre.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_")
              : `actividad-${actIndex + 1}`;
            const filename = `${folio}_${activityName}_${evIndex + 1}.jpg`;
            allEvidences.push({ url: evidencia.url, filename });
          }
        });
      }
    });

    if (allEvidences.length === 0) {
      alert("No hay imágenes para descargar");
      return;
    }

    // Show confirmation
    const confirmed = confirm(
      `Se descargarán ${allEvidences.length} imagen(es). ¿Continuar?`
    );
    if (!confirmed) return;

    // Download each image with a small delay to avoid browser blocking
    for (let i = 0; i < allEvidences.length; i++) {
      const { url, filename } = allEvidences[i];
      
      try {
        // Fetch image as blob
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        
        const blob = await response.blob();
        
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
        console.error(`Error downloading image ${filename}:`, error);
      }
    }

    alert(`Descarga completada: ${allEvidences.length} imagen(es)`);
  } catch (error) {
    console.error("Error downloading images:", error);
    alert("Error al descargar las imágenes");
  }
}
