"use client";
import React from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  message?: string;
  itemName?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
  title = "Confirmar eliminación",
  message,
  itemName,
}) => {
  if (!isOpen) return null;

  const defaultMessage = itemName
    ? `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`
    : "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-600">{message || defaultMessage}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
