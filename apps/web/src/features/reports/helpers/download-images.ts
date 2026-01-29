import { pdf, Document, Page, Image, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  collectWorkReportEvidences,
  resolveWorkReportEvidenceUrl,
  WorkReportEvidenceItem,
} from "../utils/evidence";

interface Activity {
  evidencias?: WorkReportEvidenceItem[];
  nombre?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  imageContainer: {
    marginBottom: 15,
    border: "1px solid #cccccc",
    padding: 10,
  },
  image: {
    width: "100%",
    height: "auto",
    maxHeight: 400,
    objectFit: "contain",
  },
  imageLabel: {
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
    color: "#666666",
  },
});

/**
 * Download all evidence images from a work report as a PDF
 * Creates a PDF with all images displayed one per page
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
      `Se descargarán ${allEvidences.length} imagen(es) en un PDF. ¿Continuar?`
    );
    if (!confirmed) return;

    // Resolve all image URLs
    const imageUrls: string[] = [];
    for (let i = 0; i < allEvidences.length; i++) {
      const evidence = allEvidences[i];
      
      try {
        const url = await resolveWorkReportEvidenceUrl(evidence);
        if (url) {
          imageUrls.push(url);
        }
      } catch (error) {
        console.error(`Error resolving image ${i + 1}:`, error);
      }
    }

    if (imageUrls.length === 0) {
      alert("No se pudo cargar ninguna imagen");
      return;
    }

    // Create PDF document
    const EvidencePDF = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>
            Evidencias del Reporte {folio}
          </Text>
          {imageUrls.map((url, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image src={url} style={styles.image} />
              <Text style={styles.imageLabel}>
                Evidencia {index + 1} de {imageUrls.length}
              </Text>
            </View>
          ))}
        </Page>
      </Document>
    );

    // Generate and download PDF
    const blob = await pdf(<EvidencePDF />).toBlob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${folio}_evidencias.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    alert(`Descarga completada: ${imageUrls.length} imagen(es) en PDF`);
  } catch (error) {
    console.error("Error downloading images:", error);
    alert("Error al descargar las imágenes");
  }
}
