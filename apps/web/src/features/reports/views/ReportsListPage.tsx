"use client";
import React, { useState, lazy, Suspense } from "react";
import {
  Search,
  Filter,
  Plus,
  FileText,
  Calendar,
  User,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { useRouter } from "next/navigation";
import { useWorkReportsPaginatedQuery } from "@/hooks/useWorkReports";
import { AppLayout } from "@/shared/layout/AppLayout";

// Lazy load the ReportExplorer component for code splitting
const ReportExplorer = lazy(() =>
  import("../components/ReportExplorer").then((mod) => ({
    default: mod.ReportExplorer,
  })),
);

const ExplorerLoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

const PAGE_SIZE = 50;

export const ReportsListPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Only fetch reports when user is actively searching
  const isSearching = searchTerm.length > 0;
  const {
    data: paginatedResult,
    isLoading: isSearchLoading,
    error,
  } = useWorkReportsPaginatedQuery(
    { limit: PAGE_SIZE, offset: currentPage * PAGE_SIZE },
    { enabled: isSearching },
  );

  const workReports = paginatedResult?.data ?? [];
  const totalReports = paginatedResult?.total ?? 0;
  const totalPages = Math.ceil(totalReports / PAGE_SIZE);

  const filteredReports = workReports.filter((report) => {
    const matchesSearch =
      report.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.subsistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.responsable.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Reset pagination when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  return (
    <AppLayout title="Reportes de Trabajo">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reportes de Trabajo
            </h1>
            <p className="text-gray-500">
              Gestiona y consulta los reportes de mantenimiento
            </p>
          </div>
          <Button onClick={() => router.push("/reports/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reporte
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio, subsistema o responsable..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos los turnos</option>
                  <option value="matutino">Matutino</option>
                  <option value="vespertino">Vespertino</option>
                  <option value="nocturno">Nocturno</option>
                </select>
              </div>
            </div>
          </div>

          {!isSearching ? (
            <div className="p-6">
              <Suspense fallback={<ExplorerLoadingFallback />}>
                <ReportExplorer type="work" />
              </Suspense>
            </div>
          ) : isSearchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              Error al cargar reportes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      Folio
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      Subsistema
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      Responsable
                    </th>
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      Turno
                    </th>
                    <th className="px-6 py-3 font-medium text-right whitespace-nowrap">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No se encontraron reportes que coincidan con tu búsqueda
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="bg-white hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-blue-600 whitespace-nowrap">
                          {report.folio}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                            <span
                              className="block truncate max-w-[200px]"
                              title={report.subsistema}
                            >
                              {report.subsistema}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                            {report.fecha}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                            {report.responsable}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${
                                  report.turno === "Matutino"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : report.turno === "Vespertino"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-indigo-100 text-indigo-800"
                                }`}
                          >
                            {report.turno}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => router.push(`/reports/${report.id}`)}
                          >
                            Ver detalle
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>
              {isSearching
                ? `Mostrando ${filteredReports.length} de ${totalReports} reportes`
                : "Navegando por carpetas"}
            </span>
            {isSearching && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
