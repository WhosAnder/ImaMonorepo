import React, { useMemo, useState } from "react";
import { Camera, X, Image as ImageIcon, Loader2 } from "lucide-react";

const generateLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export interface LocalEvidence {
  id: string;
  previewUrl: string;
  base64: string;
  name?: string;
  size?: number;
  url?: string;
  key?: string;
}

type IncomingEvidence =
  | LocalEvidence
  | string
  | {
      id?: string;
      previewUrl?: string;
      url?: string;
      base64?: string;
      name?: string;
      size?: number;
      key?: string;
    };

const normalizeEvidence = (input: IncomingEvidence): LocalEvidence => {
  if (typeof input === "string") {
    return {
      id: generateLocalId(),
      previewUrl: input,
      base64: input,
    };
  }

  if (input && typeof input === "object" && "previewUrl" in input && "base64" in input) {
    const candidate = input as LocalEvidence;
    return {
      id: candidate.id || generateLocalId(),
      previewUrl: candidate.previewUrl,
      base64: candidate.base64 || candidate.previewUrl,
      name: candidate.name,
      size: candidate.size,
      url: candidate.url,
      key: candidate.key,
    };
  }

  if (input && typeof input === "object") {
    const candidate = input as {
      id?: string;
      previewUrl?: string;
      url?: string;
      base64?: string;
      name?: string;
      size?: number;
      key?: string;
    };

    const preview =
      candidate.previewUrl ||
      candidate.base64 ||
      candidate.url ||
      "";

    return {
      id: candidate.id || generateLocalId(),
      previewUrl: preview,
      base64: candidate.base64 || preview,
      name: candidate.name,
      size: candidate.size,
      url: candidate.url,
      key: candidate.key,
    };
  }

  return {
    id: generateLocalId(),
    previewUrl: "",
    base64: "",
  };
};

const fileToEvidence = (file: File): Promise<LocalEvidence> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve({
        id: generateLocalId(),
        previewUrl: result,
        base64: result,
        name: file.name,
        size: file.size,
      });
    };
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
};

interface ImageUploadProps {
  value?: IncomingEvidence[];
  onChange: (files: LocalEvidence[]) => void;
  label?: string;
  error?: string;
  maxFiles?: number;
  compact?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
  error,
  maxFiles = 3,
  compact = false,
}) => {
  const [internalFiles, setInternalFiles] = useState<LocalEvidence[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const effectiveMaxFiles = Math.min(Math.max(maxFiles, 1), 5);
  const isControlled = value !== undefined;
  const files = useMemo(() => {
    if (isControlled) {
      const incoming = value ?? [];
      return incoming.map((item) => normalizeEvidence(item));
    }
    return internalFiles;
  }, [isControlled, value, internalFiles]);

  const updateFiles = (next: LocalEvidence[]) => {
    if (!isControlled) {
      setInternalFiles(next);
    }
    onChange(next);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    const availableSlots = Math.max(effectiveMaxFiles - files.length, 0);
    const selectedFiles = Array.from(e.target.files).slice(0, availableSlots);
    e.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const converted = await Promise.all(selectedFiles.map((file) => fileToEvidence(file)));
      const nextValue = [...files, ...converted].slice(0, effectiveMaxFiles);
      updateFiles(nextValue);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo preparar la evidencia";
      setProcessingError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    updateFiles(updated);
  };

  const canAddMore = files.length < effectiveMaxFiles && !isProcessing;

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
            accept="image/*"
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
            {isProcessing ? "Procesando..." : compact ? "Foto" : "Tomar foto"}
          </label>
          <span className="text-xs text-gray-500">
            {files.length} / {effectiveMaxFiles}
          </span>
        </div>

        {files.length > 0 && (
          <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
            {files.map((file, index) => (
              <div
                key={file.id || index}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={file.previewUrl}
                  alt={`Evidencia ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
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
              {isProcessing ? "Procesando evidencias..." : "No hay evidencias seleccionadas"}
            </span>
          </div>
        )}
      </div>

      {(error || processingError) && (
        <p className="mt-1 text-sm text-red-600">
          {error || processingError}
        </p>
      )}
    </div>
  );
};
