"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/Button";
import { AppLayout } from "@/shared/layout/AppLayout";
import { WarehouseReportPreview } from "../components/WarehouseReportPreview";
import { generatePDFReport } from "../helpers/generate-pdf";
import { ArrowLeft, DownloadIcon, Pencil, Trash2 } from "lucide-react";
import { useWarehouseReportQuery, useDeleteWarehouseReportMutation } from "@/hooks/useWarehouseReports";
import { ConfirmDeleteModal } from "@/shared/ui/ConfirmDeleteModal";
import { useAuth } from "@/auth/AuthContext";

export const WarehouseReportDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: report, isLoading, error } = useWarehouseReportQuery(id || "");
  const deleteMutation = useDeleteWarehouseReportMutation();

  const isAdmin = user?.role === "admin";

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      router.push("/almacen");
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Cargando...">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-500">Cargando reporte...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !report) {
    return (
      <AppLayout title="Reporte de almacén no encontrado">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Reporte no encontrado
          </h1>
          <p className="text-gray-500">
            El reporte que buscas no existe o no está disponible.
          </p>
          <Button variant="secondary" onClick={() => router.push("/almacen")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Reporte ${report.subsistema}`}>
      <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/almacen")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Detalle de Reporte
              </h1>
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                <span>{report.subsistema}</span>
                <span>•</span>
                <span>{report.nombreAlmacenista}</span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push(`/almacen/${id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-8 rounded-xl border border-gray-200 shadow-inner overflow-auto">
          <div className="mx-auto" style={{ width: "816px" }}>
            {" "}
            {/* Letter width */}
            <WarehouseReportPreview values={report} />
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => generatePDFReport(report as any)}
        >
          Descargar PDF <DownloadIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        itemName={`Reporte ${report.subsistema}`}
      />
    </AppLayout>
  );
};
