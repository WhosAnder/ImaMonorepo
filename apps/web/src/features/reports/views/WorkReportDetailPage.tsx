"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/Button";
import { AppLayout } from "@/shared/layout/AppLayout";
import { ArrowLeft, DownloadIcon, Pencil, Trash2 } from "lucide-react";
import { WorkReportPreview } from "../components/WorkReportPreview";
import { WorkReportEvidenceGallery } from "../components/WorkReportEvidenceGallery";
import { generateWorkReportPDF } from "../helpers/generate-pdf";
import { downloadReportImages } from "../helpers/download-images";
import {
  useWorkReportQuery,
  useDeleteWorkReportMutation,
} from "@/hooks/useWorkReports";
import { ConfirmDeleteModal } from "@/shared/ui/ConfirmDeleteModal";
import { useAuth } from "@/auth/AuthContext";

export const WorkReportDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full">
            <div className="">
              <Button variant="ghost" onClick={() => router.push("/reports")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>

              <div className="flex justify-center items-center text-center gap-6 flex-col sm:flex-row sm:text-left sm:justify-between">
                <div className="">
                  <h2 className="text-2xl font-semibold text-gray-900 mt-4">
                    Detalle del reporte
                  </h2>
                  <p className="text-gray-500">Folio: {report.folio}</p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="secondary" onClick={() => router.push(`/reports/${id}/edit`)}>
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
            </div>
          </div>
        </div>

        <WorkReportPreview values={report} />
        
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => generateWorkReportPDF(report as any)}
          >
            Descargar PDF <DownloadIcon className="h-4 w-4 ml-2" />
          </Button>
          
          <Button
            variant="secondary"
            onClick={async () => {
              setIsDownloadingImages(true);
              try {
                await downloadReportImages(
                  report.actividadesRealizadas || [],
                  report.folio
                );
              } finally {
                setIsDownloadingImages(false);
              }
            }}
            disabled={isDownloadingImages || !report.actividadesRealizadas?.some(a => a.evidencias && a.evidencias.length > 0)}
          >
            {isDownloadingImages ? "Descargando..." : "Descargar Imágenes"}
            <DownloadIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Evidence Gallery Section */}
        {report.actividadesRealizadas &&
          report.actividadesRealizadas.length > 0 && (
            <div className="mt-8">
              <WorkReportEvidenceGallery
                actividadesRealizadas={report.actividadesRealizadas}
              />
            </div>
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
