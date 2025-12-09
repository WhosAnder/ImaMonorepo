import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "./Button";
import { Eraser, Save } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  label?: string;
  error?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onChange,
  label,
  error,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [saved, setSaved] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    setSaved(false);
    onChange(null);
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
      onChange(dataUrl);
      setSaved(true);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
    setSaved(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className={`border rounded-md overflow-hidden ${error ? "border-red-500" : "border-gray-300"}`}
      >
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={clear}
            className="text-xs py-1 px-2 h-8"
          >
            <Eraser className="w-3 h-3 mr-1" />
            Limpiar
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={isEmpty || saved}
            className="text-xs py-1 px-2 h-8"
          >
            <Save className="w-3 h-3 mr-1" />
            {saved ? "Guardada" : "Guardar firma"}
          </Button>
        </div>

        <div className="h-40 bg-white cursor-crosshair relative">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: "w-full h-full",
            }}
            onBegin={handleBegin}
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-300 text-sm">Firme aquí</span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
