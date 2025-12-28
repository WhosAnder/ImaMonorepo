"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/Button";
import { AppLayout } from "@/shared/layout/AppLayout";
import { ArrowLeft, DownloadIcon, Pencil, Trash2 } from "lucide-react";
import { WorkReportPreview } from "../components/WorkReportPreview";
import { EvidenceCarousel } from "../components/EvidenceCarousel";
import { generateWorkReportPDF } from "../helpers/generate-pdf";
import { useWorkReportQuery, useDeleteWorkReportMutation } from "@/hooks/useWorkReports";
import { ConfirmDeleteModal } from "@/shared/ui/ConfirmDeleteModal";
import { useAuth } from "@/auth/AuthContext";

export const WorkReportDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: report, isLoading, error } = useWorkReportQuery(id || "");
  const deleteMutation = useDeleteWorkReportMutation();

  const isAdmin = user?.role === "admin";

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      router.push("/reports");
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando reporte...</div>;
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Reporte no encontrado</p>
        <Button variant="secondary" onClick={() => router.push("/reports")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Button>
      </div>
    );
  }

  return (
    <AppLayout title="Detalle de Reporte">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/reports")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalle de Reporte
              </h1>
              <p className="text-gray-500">Folio: {report.folio}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push(`/reports/${id}/edit`)}
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

        <WorkReportPreview values={report} />
        <Button
          variant="secondary"
          onClick={() => generateWorkReportPDF(report as any)}
        >
          Descargar PDF <DownloadIcon className="h-4 w-4 ml-2" />
        </Button>
        {report.evidencias && report.evidencias.length > 0 && (
          <EvidenceCarousel evidences={report.evidencias} />
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        itemName={`Reporte ${report.folio}`}
      />
    </AppLayout>
  );
};
