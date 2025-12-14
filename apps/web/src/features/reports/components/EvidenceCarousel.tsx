import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { resolveEvidenceUrl } from "../utils/evidence";

interface EvidenceCarouselProps {
  evidences: Array<{ id?: string; url?: string; previewUrl?: string; key?: string } | string>;
}

export const EvidenceCarousel: React.FC<EvidenceCarouselProps> = ({ evidences }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  if (!evidences || evidences.length === 0) {
    return null;
  }

  const validEvidences = evidences
    .map((item) => ({
      item,
      url: resolveEvidenceUrl(item as any),
    }))
    .filter((evidence) => evidence.url);

  if (validEvidences.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validEvidences.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validEvidences.length - 1 ? 0 : prev + 1));
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const goToPreviousFullscreen = () => {
    setFullscreenIndex((prev) => (prev === 0 ? validEvidences.length - 1 : prev - 1));
  };

  const goToNextFullscreen = () => {
    setFullscreenIndex((prev) => (prev === validEvidences.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidencias</h3>
        <div className="relative">
          {/* Main carousel */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <div className="aspect-video relative">
              {validEvidences[currentIndex]?.url && (
                <img
                  src={validEvidences[currentIndex].url}
                  alt={`Evidencia ${currentIndex + 1}`}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => openFullscreen(currentIndex)}
                />
              )}
            </div>

            {/* Navigation arrows */}
            {validEvidences.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Indicators */}
            {validEvidences.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {validEvidences.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-8 bg-white"
                        : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Ir a evidencia ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {validEvidences.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {validEvidences.map((evidence, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={evidence.url}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="mt-2 text-sm text-gray-500 text-center">
            {currentIndex + 1} / {validEvidences.length}
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && validEvidences[fullscreenIndex]?.url && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-8 h-8" />
          </button>

          {validEvidences.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousFullscreen();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors z-10"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextFullscreen();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors z-10"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validEvidences[fullscreenIndex].url}
              alt={`Evidencia ${fullscreenIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {validEvidences.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {fullscreenIndex + 1} / {validEvidences.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};
