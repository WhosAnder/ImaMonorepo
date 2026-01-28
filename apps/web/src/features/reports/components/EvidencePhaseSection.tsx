import React from "react";
import { ImageUpload, LocalEvidence } from "@/shared/ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Camera } from "lucide-react";

interface EvidencePhaseSectionProps {
  phase: "antes" | "durante" | "despues";
  title: string;
  description: string;
  evidences: LocalEvidence[];
  isLocked: boolean;
  isActive: boolean;
  onEvidencesChange: (files: LocalEvidence[]) => void;
  onSave: () => void;
  minPhotos: number;
  maxPhotos: number;
}

export const EvidencePhaseSection: React.FC<EvidencePhaseSectionProps> = ({
  phase,
  title,
  description,
  evidences,
  isLocked,
  isActive,
  onEvidencesChange,
  onSave,
  minPhotos,
  maxPhotos,
}) => {
  const canSave = evidences.length >= minPhotos && evidences.length <= maxPhotos;
  const photoCount = evidences.length;

  return (
    <div
      className={`border rounded-lg p-6 transition-all ${
        isLocked
          ? "bg-gray-50 border-gray-300"
          : isActive
            ? "bg-white border-green-500 shadow-md"
            : "bg-gray-100 border-gray-300 opacity-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isLocked
                ? "bg-green-100 text-green-600"
                : isActive
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-400"
            }`}
          >
            {isLocked ? (
              <Check className="h-5 w-5" />
            ) : isActive ? (
              <Camera className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        {/* Status Badge */}
        <Badge
          variant={isLocked ? "default" : isActive ? "secondary" : "outline"}
          className={
            isLocked
              ? "bg-green-100 text-green-700"
              : isActive
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
          }
        >
          {isLocked ? "Guardado" : isActive ? "Activo" : "Bloqueado"}
        </Badge>
      </div>

      {/* Photo Counter */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">
          Fotos: {photoCount}/{maxPhotos}
          <span className="text-gray-500 ml-2">
            (Mínimo {minPhotos}, Máximo {maxPhotos})
          </span>
        </p>
      </div>

      {/* Image Upload Area */}
      {isLocked ? (
        // Locked state - show saved photos in read-only mode
        <div className="grid grid-cols-3 gap-4">
          {evidences.map((evidence, index) => (
            <div key={evidence.id || index} className="relative">
              <img
                src={evidence.previewUrl}
                alt={`${title} - Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      ) : isActive ? (
        // Active state - allow upload
        <div>
          <ImageUpload
            value={evidences}
            onChange={onEvidencesChange}
            maxFiles={maxPhotos}
            disabled={false}
          />

          {/* Save Button */}
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="bg-green-600 hover:bg-green-700"
            >
              {canSave
                ? `Guardar ${title}`
                : `Sube al menos ${minPhotos} foto${minPhotos > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      ) : (
        // Inactive/Locked state - show placeholder
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">
            Completa la fase anterior para desbloquear
          </p>
        </div>
      )}
    </div>
  );
};
