"use client";

import React, { useState } from "react";
import { useExplorerList, useExplorerSearch } from "@/hooks/useEvidencesExplorer";
import { presignDownload } from "@/api/evidencesClient";
import {
  ExplorerListParams,
  ExplorerNode,
  ExplorerFileItem,
} from "@/api/evidencesExplorerClient";
import {
  Folder,
  File,
  ChevronRight,
  Home,
  Search,
  X,
  Download,
  Eye,
  Loader2,
  HardDrive,
  Calendar,
  FileBox,
} from "lucide-react";

const MONTH_LABELS = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const Breadcrumbs: React.FC<{
  path: ExplorerListParams;
  onNavigate: (path: ExplorerListParams) => void;
}> = ({ path, onNavigate }) => {
  const items: { label: string; path: ExplorerListParams }[] = [
    { label: "Inicio", path: {} },
  ];

  if (path.subsystemSlug) {
    items.push({
      label: path.subsystemSlug,
      path: { subsystemSlug: path.subsystemSlug },
    });
  }
  if (path.year !== undefined) {
    items.push({
      label: String(path.year),
      path: { subsystemSlug: path.subsystemSlug, year: path.year },
    });
  }
  if (path.month !== undefined) {
    items.push({
      label: MONTH_LABELS[path.month] || String(path.month),
      path: { subsystemSlug: path.subsystemSlug, year: path.year, month: path.month },
    });
  }
  if (path.day !== undefined) {
    items.push({
      label: String(path.day).padStart(2, "0"),
      path: {
        subsystemSlug: path.subsystemSlug,
        year: path.year,
        month: path.month,
        day: path.day,
      },
    });
  }
  if (path.reportType) {
    items.push({
      label: path.reportType === "work" ? "Trabajo" : "Almacén",
      path: {
        subsystemSlug: path.subsystemSlug,
        year: path.year,
        month: path.month,
        day: path.day,
        reportType: path.reportType,
      },
    });
  }
  if (path.reportId) {
    items.push({
      label: `Reporte ${path.reportId.slice(-6)}`,
      path,
    });
  }

  return (
    <nav className="flex items-center text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
          <button
            onClick={() => onNavigate(item.path)}
            className={`hover:text-blue-600 ${
              index === items.length - 1 ? "font-semibold text-gray-900" : ""
            }`}
          >
            {index === 0 ? <Home className="w-4 h-4" /> : item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

// ============================================================================
// FOLDER CARD
// ============================================================================

const FolderCard: React.FC<{
  node: ExplorerNode;
  onClick: () => void;
}> = ({ node, onClick }) => {
  const getIcon = () => {
    switch (node.type) {
      case "subsystem":
        return <HardDrive className="w-8 h-8 text-blue-500" />;
      case "year":
        return <Calendar className="w-8 h-8 text-indigo-500" />;
      case "month":
        return <Calendar className="w-8 h-8 text-green-500" />;
      case "day":
        return <Calendar className="w-8 h-8 text-teal-500" />;
      case "reportType":
        return <FileBox className="w-8 h-8 text-purple-500" />;
      case "report":
        return <Folder className="w-8 h-8 text-amber-500" />;
      default:
        return <Folder className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center min-w-[120px]"
    >
      {getIcon()}
      <span className="mt-2 text-sm font-medium text-gray-700 truncate max-w-full">
        {node.label}
      </span>
      <span className="text-xs text-gray-400">{node.count} archivos</span>
    </button>
  );
};

// ============================================================================
// FILE ROW
// ============================================================================

const FileRow: React.FC<{
  file: ExplorerFileItem;
  onPreview: () => void;
  onDownload: () => void;
}> = ({ file, onPreview, onDownload }) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.originalName}
          </p>
          <p className="text-xs text-gray-500">
            {formatSize(file.size)} • {formatDate(file.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isImage && (
          <button
            onClick={onPreview}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Vista previa"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDownload}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
          title="Descargar"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export const FileExplorerPage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<ExplorerListParams>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data, isLoading, error } = useExplorerList(currentPath);
  const { data: searchData } = useExplorerSearch(
    { q: searchQuery },
    isSearching && searchQuery.length > 0
  );

  const handleNavigate = (path: ExplorerListParams) => {
    setCurrentPath(path);
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleFolderClick = (node: ExplorerNode) => {
    const newPath: ExplorerListParams = {
      subsystemSlug: node.subsystemSlug,
      year: node.year,
      month: node.month,
      day: node.day,
      reportType: node.reportType,
      reportId: node.reportId,
    };
    setCurrentPath(newPath);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const handleDownload = async (fileId: string) => {
    try {
      const result = await presignDownload({ fileId });
      window.open(result.url, "_blank");
    } catch (err) {
      console.error("Download error:", err);
      alert("Error al descargar el archivo");
    }
  };

  const handlePreview = async (fileId: string) => {
    try {
      const result = await presignDownload({ fileId });
      setPreviewUrl(result.url);
    } catch (err) {
      console.error("Preview error:", err);
      alert("Error al cargar la vista previa");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Explorador de Evidencias
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Navega por los archivos de evidencia organizados por subsistema, fecha
          y tipo de reporte
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Breadcrumbs */}
        {!isSearching && (
          <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error al cargar: {error.message}
          </div>
        )}

        {/* Search Results */}
        {isSearching && searchData && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Resultados para "{searchQuery}" ({searchData.count})
              </h2>
              <button
                onClick={handleClearSearch}
                className="text-sm text-blue-600 hover:underline"
              >
                Volver al explorador
              </button>
            </div>
            {searchData.results.length > 0 ? (
              <div className="space-y-2">
                {searchData.results.map((result) => (
                  <div
                    key={result.fileId}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium">{result.originalName}</p>
                      <p className="text-sm text-gray-500">
                        {result.subsystem} / {result.datePath} /{" "}
                        {result.reportType}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(result.fileId)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No se encontraron resultados</p>
            )}
          </div>
        )}

        {/* Folder Contents */}
        {!isSearching && data && !isLoading && (
          <>
            {/* Folders */}
            {data.folders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                {data.folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    node={folder}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
              </div>
            )}

            {/* Files */}
            {data.files.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Archivos ({data.files.length})
                </h3>
                {data.files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onPreview={() => handlePreview(file.id)}
                    onDownload={() => handleDownload(file.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {data.folders.length === 0 && data.files.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay archivos en esta carpeta</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorerPage;
