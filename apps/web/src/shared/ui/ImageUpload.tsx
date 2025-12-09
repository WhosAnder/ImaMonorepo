import React, { useState } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./Button";

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  label?: string;
  error?: string;
  maxFiles?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  label,
  error,
  maxFiles = 5,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...files, ...newFiles].slice(0, maxFiles);

      setFiles(totalFiles);
      onChange(totalFiles);

      // Create previews
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
    }
  };

  const removeImage = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles);

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
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
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            id="evidence-upload"
            onChange={handleFileChange}
            disabled={files.length >= maxFiles}
          />
          <label
            htmlFor="evidence-upload"
            className={`
              flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer
              ${files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <Camera className="w-4 h-4 mr-2" />
            Tomar foto
          </label>
          <span className="text-xs text-gray-500">
            {files.length} / {maxFiles} fotos
          </span>
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={preview}
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

        {previews.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm">No hay evidencias seleccionadas</span>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
