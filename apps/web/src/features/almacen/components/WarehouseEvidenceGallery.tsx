import React, { useEffect, useState } from "react";
import { EvidenceCarousel } from "@/features/reports/components/EvidenceCarousel";
import {
  collectAllEvidences,
  resolveWarehouseEvidenceUrl,
  EvidenceItem,
} from "../utils/evidence";

interface WarehouseEvidenceGalleryProps {
  herramientas: Array<{ evidences?: EvidenceItem[] }>;
  refacciones: Array<{ evidences?: EvidenceItem[] }>;
}

interface ResolvedEvidence {
  id: string;
  url: string | null;
  isLoading: boolean;
  hasFailed: boolean;
}

export const WarehouseEvidenceGallery: React.FC<
  WarehouseEvidenceGalleryProps
> = ({ herramientas, refacciones }) => {
  const [resolvedEvidences, setResolvedEvidences] = useState<
    ResolvedEvidence[]
  >([]);
  const [failedCount, setFailedCount] = useState(0);
  const [hasShownAlert, setHasShownAlert] = useState(false);

  useEffect(() => {
    const allEvidences = collectAllEvidences(herramientas, refacciones);

    if (allEvidences.length === 0) {
      return;
    }

    // Initialize with loading state
    const initialState: ResolvedEvidence[] = allEvidences.map((ev) => ({
      id: ev.id,
      url: null,
      isLoading: true,
      hasFailed: false,
    }));
    setResolvedEvidences(initialState);

    // Reset state
    setFailedCount(0);
    setHasShownAlert(false);

    // Fetch URLs lazily (as they load)
    let failed = 0;
    allEvidences.forEach(async (evidence, index) => {
      try {
        const url = await resolveWarehouseEvidenceUrl(evidence);

        setResolvedEvidences((prev) => {
          const updated = [...prev];
          updated[index] = {
            id: evidence.id,
            url,
            isLoading: false,
            hasFailed: url === null,
          };
          return updated;
        });

        if (url === null) {
          failed++;
          setFailedCount(failed);
        }
      } catch (error) {
        console.error("Error resolving evidence URL:", error);
        setResolvedEvidences((prev) => {
          const updated = [...prev];
          updated[index] = {
            id: evidence.id,
            url: null,
            isLoading: false,
            hasFailed: true,
          };
          return updated;
        });
        failed++;
        setFailedCount(failed);
      }
    });
  }, [herramientas, refacciones]);

  // Show alert when images fail to load (only once when all are done loading)
  useEffect(() => {
    const allLoaded = resolvedEvidences.every((ev) => !ev.isLoading);
    if (failedCount > 0 && allLoaded && !hasShownAlert) {
      alert(
        `No se pudieron cargar ${failedCount} imagen${failedCount > 1 ? "es" : ""}`,
      );
      setHasShownAlert(true);
    }
  }, [failedCount, resolvedEvidences, hasShownAlert]);

  // Filter out loading and failed evidences for the carousel
  const validEvidences = resolvedEvidences
    .filter((ev) => !ev.isLoading && ev.url !== null)
    .map((ev) => ({
      id: ev.id,
      url: ev.url!,
    }));

  // Debug: Log the URLs being passed to carousel
  console.log("Valid evidences for carousel:", validEvidences);

  // Show nothing if no evidences
  const allEvidences = collectAllEvidences(herramientas, refacciones);
  if (allEvidences.length === 0) {
    return null;
  }

  // Show loading state while all are loading
  const allLoading = resolvedEvidences.every((ev) => ev.isLoading);
  if (allLoading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Evidencias del Reporte
        </h2>
        <div className="bg-gray-100 rounded-lg border border-gray-200 p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando evidencias...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show carousel with loaded evidences
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Evidencias del Reporte
      </h2>
      {validEvidences.length > 0 ? (
        <EvidenceCarousel evidences={validEvidences} />
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No se pudieron cargar las evidencias</p>
        </div>
      )}
    </div>
  );
};
