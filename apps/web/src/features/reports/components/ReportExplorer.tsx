"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useReportsExplorer } from "@/hooks/useReportsExplorer";
import {
  ReportExplorerParams,
  ReportExplorerNode,
  ReportItem,
} from "@/api/reportsExplorerClient";
import {
  ChevronRight,
  Home,
  Loader2,
  FileText,
  Clock,
  User,
} from "lucide-react";

const MONTH_LABELS = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// ============================================================================
// URL HELPERS
// ============================================================================

function buildExplorerUrl(
  pathname: string,
  params: ReportExplorerParams,
): string {
  const searchParams = new URLSearchParams();

  if (params.subsystemSlug) {
    searchParams.set("subsystem", params.subsystemSlug);
  }
  if (params.year !== undefined) {
    searchParams.set("year", String(params.year));
  }
  if (params.month !== undefined) {
    searchParams.set("month", String(params.month));
  }
  if (params.day !== undefined) {
    searchParams.set("day", String(params.day));
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function parseExplorerParams(
  searchParams: URLSearchParams,
  type: "work" | "warehouse",
): ReportExplorerParams {
  const subsystemSlug = searchParams.get("subsystem") || undefined;
  const yearStr = searchParams.get("year");
  const monthStr = searchParams.get("month");
  const dayStr = searchParams.get("day");

  return {
    type,
    subsystemSlug,
    year: yearStr ? parseInt(yearStr, 10) : undefined,
    month: monthStr ? parseInt(monthStr, 10) : undefined,
    day: dayStr ? parseInt(dayStr, 10) : undefined,
  };
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

const Breadcrumbs: React.FC<{
  path: ReportExplorerParams;
  pathname: string;
  onNavigate: (url: string) => void;
}> = ({ path, pathname, onNavigate }) => {
  const items: { label: string; path: ReportExplorerParams }[] = [
    { label: "Inicio", path: { type: path.type } },
  ];

  if (path.subsystemSlug) {
    items.push({
      label: path.subsystemSlug,
      path: { type: path.type, subsystemSlug: path.subsystemSlug },
    });
  }
  if (path.year !== undefined) {
    items.push({
      label: String(path.year),
      path: {
        type: path.type,
        subsystemSlug: path.subsystemSlug,
        year: path.year,
      },
    });
  }
  if (path.month !== undefined) {
    items.push({
      label: MONTH_LABELS[path.month] || String(path.month),
      path: {
        type: path.type,
        subsystemSlug: path.subsystemSlug,
        year: path.year,
        month: path.month,
      },
    });
  }
  if (path.day !== undefined) {
    items.push({
      label: String(path.day).padStart(2, "0"),
      path: {
        type: path.type,
        subsystemSlug: path.subsystemSlug,
        year: path.year,
        month: path.month,
        day: path.day,
      },
    });
  }

  return (
    <nav className="flex items-center text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
          <button
            onClick={() => onNavigate(buildExplorerUrl(pathname, item.path))}
            className={`hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-white ${
              index === items.length - 1
                ? "font-semibold text-gray-900 bg-white shadow-sm border border-gray-100"
                : ""
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
// CUSTOM ICONS
// ============================================================================

const CustomFolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2.5 7.5C2.5 5.84315 3.84315 4.5 5.5 4.5H8.87868C9.67433 4.5 10.4374 4.81607 11 5.37868L12.6213 7H18.5C20.1569 7 21.5 8.34315 21.5 10V18.5C21.5 20.1569 20.1569 21.5 18.5 21.5H5.5C3.84315 21.5 2.5 20.1569 2.5 18.5V7.5Z"
      className="stroke-blue-500"
      strokeWidth="2"
    />
    <path
      d="M4.5 10.5C4.5 9.39543 5.39543 8.5 6.5 8.5H19.5C20.6046 8.5 21.5 9.39543 21.5 10.5V18.5C21.5 19.6046 20.6046 20.5 19.5 20.5H6.5C5.39543 20.5 4.5 19.6046 4.5 18.5V10.5Z"
      className="fill-blue-100 stroke-blue-500"
      strokeWidth="2"
    />
  </svg>
);

// ============================================================================
// FOLDER ROW
// ============================================================================

const FolderRow: React.FC<{
  node: ReportExplorerNode;
  onClick: () => void;
}> = ({ node, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center w-full p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left"
    >
      <div className="shrink-0 mr-3">
        <CustomFolderIcon className="w-9 h-9" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate">
          {node.label}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {node.count} {node.count === 1 ? "reporte" : "reportes"}
        </p>
      </div>

      <div className="shrink-0 ml-4 text-gray-300 group-hover:text-blue-400">
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
};

// ============================================================================
// REPORT ROW
// ============================================================================

const ReportRow: React.FC<{
  report: ReportItem;
  type: "work" | "warehouse";
  onClick: () => void;
}> = ({ report, type, onClick }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div
          className={`p-3 rounded-xl ${type === "work" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100" : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"} transition-colors`}
        >
          <FileText className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-gray-900 text-lg">
              Folio: {report.folio}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}
            >
              {report.status === "completed" ? "Completado" : report.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate font-medium">
            {report.description}
          </p>
          <div className="flex items-center gap-6 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(report.date)}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
              <User className="w-3.5 h-3.5" />
              {report.author}
            </span>
          </div>
        </div>
      </div>
      <div className="pl-4">
        <div className="p-2 rounded-full bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ReportExplorerProps {
  type: "work" | "warehouse";
}

export const ReportExplorer: React.FC<ReportExplorerProps> = ({ type }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current path from URL search params
  const currentPath = useMemo(
    () => parseExplorerParams(searchParams, type),
    [searchParams, type],
  );

  const { data, isLoading, error } = useReportsExplorer(currentPath);

  const handleNavigate = (url: string) => {
    router.push(url);
  };

  const handleFolderClick = (node: ReportExplorerNode) => {
    const newPath: ReportExplorerParams = {
      type,
      subsystemSlug: node.subsystemSlug,
      year: node.year,
      month: node.month,
      day: node.day,
    };
    const url = buildExplorerUrl(pathname, newPath);
    router.push(url);
  };

  const handleReportClick = (report: ReportItem) => {
    if (type === "work") {
      router.push(`/reports/${report.reportId}`);
    } else {
      router.push(`/almacen/${report.reportId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error al cargar reportes: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        path={currentPath}
        pathname={pathname}
        onNavigate={handleNavigate}
      />

      {/* Folders List */}
      {data?.folders && data.folders.length > 0 && (
        <div className="space-y-3">
          {data.folders.map((folder) => (
            <FolderRow
              key={folder.id}
              node={folder}
              onClick={() => handleFolderClick(folder)}
            />
          ))}
        </div>
      )}

      {/* Reports List */}
      {data?.reports && data.reports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Reportes ({data.reports.length})
          </h3>
          {data.reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              type={type}
              onClick={() => handleReportClick(report)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {data?.folders.length === 0 && data?.reports.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block p-4 rounded-full bg-gray-50 mb-3">
            <CustomFolderIcon className="w-12 h-12 opacity-50" />
          </div>
          <p>No hay reportes en esta carpeta</p>
        </div>
      )}
    </div>
  );
};
