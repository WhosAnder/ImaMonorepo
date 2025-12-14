import React, { useState, useCallback } from "react";
import { Camera, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { uploadEvidence, EvidenceInfo } from "@/api/evidencesClient";

export interface EvidenceFile {
  id: string;
  localId: string;
  file?: File;
  previewUrl: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
  // After upload
  key?: string;
  originalName?: string;
}

interface EvidenceUploadProps {
  reportId: string;
  reportType: "work" | "warehouse";
  value?: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
  label?: string;
  error?: string;
  maxFiles?: number;
  compact?: boolean;
  autoUpload?: boolean;
}

const generateLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  reportId,
  reportType,
  value = [],
  onChange,
  label,
  error,
  maxFiles = 3,
  compact = false,
  autoUpload = true,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const effectiveMaxFiles = Math.min(Math.max(maxFiles, 1), 10);
  
  const files = value;

  const updateFiles = useCallback((next: EvidenceFile[]) => {
    onChange(next);
  }, [onChange]);

  /**
   * Upload a single file using presigned URL flow
   */
  const uploadSingleFile = async (evidenceFile: EvidenceFile): Promise<EvidenceFile> => {
    if (!evidenceFile.file) {
      return { ...evidenceFile, status: "error", error: "No file" };
    }

    try {
      const result = await uploadEvidence({
        reportId,
        reportType,
        file: evidenceFile.file,
      });

      return {
        ...evidenceFile,
        id: result.id,
        key: result.key,
        originalName: result.originalName,
        status: "uploaded",
        error: undefined,
      };
    } catch (err) {
      return {
        ...evidenceFile,
        status: "error",
        error: err instanceof Error ? err.message : "Error al subir",
      };
    }
  };

  /**
   * Handle file selection
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const availableSlots = Math.max(effectiveMaxFiles - files.length, 0);
    const selectedFiles = Array.from(e.target.files).slice(0, availableSlots);
    e.target.value = "";

    if (selectedFiles.length === 0) return;

    setIsProcessing(true);

    // Create preview objects
    const newFiles: EvidenceFile[] = await Promise.all(
      selectedFiles.map(async (file) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: "",
          localId: generateLocalId(),
          file,
          previewUrl,
          status: "pending" as const,
          originalName: file.name,
        };
      })
    );

    const updatedFiles = [...files, ...newFiles];
    updateFiles(updatedFiles);

    // Auto-upload if enabled and reportId is valid
    if (autoUpload && reportId) {
      const uploadPromises = newFiles.map((ef) => uploadSingleFile(ef));
      const results = await Promise.all(uploadPromises);

      // Merge results back
      const finalFiles = updatedFiles.map((f) => {
        const uploaded = results.find((r) => r.localId === f.localId);
        return uploaded || f;
      });

      updateFiles(finalFiles);
    }

    setIsProcessing(false);
  };

  /**
   * Manually trigger upload for pending files
   */
  const uploadPending = async () => {
    if (!reportId) return;

    setIsProcessing(true);

    const pendingFiles = files.filter((f) => f.status === "pending" && f.file);
    
    // Mark as uploading
    const uploadingFiles = files.map((f) =>
      f.status === "pending" ? { ...f, status: "uploading" as const } : f
    );
    updateFiles(uploadingFiles);

    // Upload each
    const results = await Promise.all(pendingFiles.map(uploadSingleFile));

    // Merge results
    const finalFiles = uploadingFiles.map((f) => {
      const result = results.find((r) => r.localId === f.localId);
      return result || f;
    });

    updateFiles(finalFiles);
    setIsProcessing(false);
  };

  const removeFile = (localId: string) => {
    const updated = files.filter((f) => f.localId !== localId);
    updateFiles(updated);
  };

  const canAddMore = files.length < effectiveMaxFiles && !isProcessing;
  const hasPending = files.some((f) => f.status === "pending");
  const hasErrors = files.some((f) => f.status === "error");

  const getStatusIcon = (status: EvidenceFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "uploaded":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            multiple={effectiveMaxFiles > 1}
            className="hidden"
            id={`evidence-upload-${label || "default"}`}
            onChange={handleFileChange}
            disabled={!canAddMore}
          />
          <label
            htmlFor={`evidence-upload-${label || "default"}`}
            className={`
              flex items-center justify-center border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer
              ${!canAddMore ? "opacity-50 cursor-not-allowed" : ""}
              ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"}
            `}
          >
            {isProcessing ? (
              <Loader2 className={`animate-spin ${compact ? "w-3 h-3" : "w-4 h-4"}`} />
            ) : (
              <Camera className={`${compact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
            )}
            {isProcessing ? "Subiendo..." : compact ? "Foto" : "Tomar foto"}
          </label>
          
          <span className="text-xs text-gray-500">
            {files.length} / {effectiveMaxFiles}
          </span>

          {hasPending && !autoUpload && (
            <button
              type="button"
              onClick={uploadPending}
              disabled={isProcessing || !reportId}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Subir pendientes
            </button>
          )}
        </div>

        {files.length > 0 && (
          <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
            {files.map((file) => (
              <div
                key={file.localId}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={file.previewUrl}
                  alt={file.originalName || "Evidencia"}
                  className="w-full h-full object-cover"
                />
                
                {/* Status indicator */}
                <div className="absolute top-1 left-1">
                  {getStatusIcon(file.status)}
                </div>
                
                {/* Error message */}
                {file.status === "error" && file.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs p-1 truncate">
                    {file.error}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => removeFile(file.localId)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && !compact && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm">
              {isProcessing ? "Subiendo evidencias..." : "No hay evidencias seleccionadas"}
            </span>
          </div>
        )}
      </div>

      {(error || hasErrors) && (
        <p className="mt-1 text-sm text-red-600">
          {error || "Algunas evidencias no se pudieron subir"}
        </p>
      )}
    </div>
  );
};

/**
 * Get uploaded evidence keys from EvidenceFile array
 */
export const getUploadedEvidenceKeys = (files: EvidenceFile[]): string[] => {
  return files
    .filter((f) => f.status === "uploaded" && f.key)
    .map((f) => f.key!);
};

/**
 * Get uploaded evidence info from EvidenceFile array
 */
export const getUploadedEvidences = (files: EvidenceFile[]): { id: string; key: string; originalName: string }[] => {
  return files
    .filter((f) => f.status === "uploaded" && f.id && f.key)
    .map((f) => ({
      id: f.id,
      key: f.key!,
      originalName: f.originalName || "",
    }));
};
