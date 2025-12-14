import { getClient } from "../../db/mongo";

const DB_NAME = process.env.MONGODB_DB_NAME || "ima";

// ============================================================================
// EXPLORER TYPES
// ============================================================================

export interface ExplorerNode {
  id: string;
  label: string;
  type: "subsystem" | "year" | "month" | "day" | "reportType" | "report";
  count: number;
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
  reportType?: string;
  reportId?: string;
}

export interface ExplorerFileItem {
  id: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  url?: string;
  key?: string;
  reportId: string;
  reportType: string;
}

export interface ExplorerListParams {
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
  reportType?: string;
  reportId?: string;
}

export interface ExplorerListResponse {
  path: ExplorerListParams;
  folders: ExplorerNode[];
  files: ExplorerFileItem[];
}

// ============================================================================
// HELPERS
// ============================================================================

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================================
// EXPLORER SERVICE - QUERIES EMBEDDED EVIDENCIAS IN REPORTS
// ============================================================================

/**
 * Get aggregated data from both report collections.
 * Evidence is embedded in reports as `evidencias[]` array.
 */
async function getReportsWithEvidencias() {
  const client = await getClient();
  const db = client.db(DB_NAME);
  
  // Fetch work reports with evidencias
  const workReports = await db.collection("workReports")
    .find(
      { "evidencias.0": { $exists: true } },
      { projection: { _id: 1, subsistema: 1, fechaHoraInicio: 1, createdAt: 1, evidencias: 1 } }
    )
    .toArray();

  // Fetch warehouse reports with evidencias  
  const warehouseReports = await db.collection("warehouseReports")
    .find(
      { "evidencias.0": { $exists: true } },
      { projection: { _id: 1, subsistema: 1, fechaHoraInicio: 1, createdAt: 1, evidencias: 1 } }
    )
    .toArray();

  // Normalize to common structure
  const allReports = [
    ...workReports.map(r => ({
      reportId: r._id.toString(),
      reportType: "work" as const,
      subsistema: r.subsistema || "Sin subsistema",
      date: new Date(r.fechaHoraInicio || r.createdAt || Date.now()),
      evidencias: (r.evidencias || []) as any[],
    })),
    ...warehouseReports.map(r => ({
      reportId: r._id.toString(),
      reportType: "warehouse" as const,
      subsistema: r.subsistema || "Sin subsistema",
      date: new Date(r.fechaHoraInicio || r.createdAt || Date.now()),
      evidencias: (r.evidencias || []) as any[],
    })),
  ];

  return allReports;
}

/**
 * List explorer nodes - queries embedded evidencias in workReports and warehouseReports
 */
export async function explorerList(params: ExplorerListParams): Promise<ExplorerListResponse> {
  const reports = await getReportsWithEvidencias();

  // Build index of all files with hierarchy info
  const files: Array<{
    subsystem: string;
    subsystemSlug: string;
    year: number;
    month: number;
    day: number;
    reportType: string;
    reportId: string;
    file: any;
  }> = [];

  for (const report of reports) {
    const subsystemSlug = slugify(report.subsistema);
    const year = report.date.getFullYear();
    const month = report.date.getMonth() + 1;
    const day = report.date.getDate();

    for (const ev of report.evidencias) {
      files.push({
        subsystem: report.subsistema,
        subsystemSlug,
        year,
        month,
        day,
        reportType: report.reportType,
        reportId: report.reportId,
        file: ev,
      });
    }
  }

  // Level 1: List all subsystems
  if (!params.subsystemSlug) {
    const subsystemMap = new Map<string, { label: string; count: number }>();
    for (const f of files) {
      const existing = subsystemMap.get(f.subsystemSlug) || { label: f.subsystem, count: 0 };
      existing.count++;
      subsystemMap.set(f.subsystemSlug, existing);
    }
    return {
      path: {},
      folders: Array.from(subsystemMap.entries()).map(([slug, data]) => ({
        id: `subsystem-${slug}`,
        label: data.label,
        type: "subsystem" as const,
        count: data.count,
        subsystemSlug: slug,
      })),
      files: [],
    };
  }

  // Filter by subsystem
  let filtered = files.filter(f => f.subsystemSlug === params.subsystemSlug);

  // Level 2: List years for subsystem
  if (params.year === undefined) {
    const yearMap = new Map<number, number>();
    for (const f of filtered) {
      yearMap.set(f.year, (yearMap.get(f.year) || 0) + 1);
    }
    return {
      path: { subsystemSlug: params.subsystemSlug },
      folders: Array.from(yearMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([year, count]) => ({
          id: `year-${params.subsystemSlug}-${year}`,
          label: String(year),
          type: "year" as const,
          count,
          subsystemSlug: params.subsystemSlug,
          year,
        })),
      files: [],
    };
  }

  // Filter by year
  filtered = filtered.filter(f => f.year === params.year);

  // Level 3: List months
  if (params.month === undefined) {
    const monthMap = new Map<number, number>();
    for (const f of filtered) {
      monthMap.set(f.month, (monthMap.get(f.month) || 0) + 1);
    }
    return {
      path: { subsystemSlug: params.subsystemSlug, year: params.year },
      folders: Array.from(monthMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, count]) => ({
          id: `month-${params.subsystemSlug}-${params.year}-${month}`,
          label: MONTH_NAMES[month] || String(month),
          type: "month" as const,
          count,
          subsystemSlug: params.subsystemSlug,
          year: params.year,
          month,
        })),
      files: [],
    };
  }

  // Filter by month
  filtered = filtered.filter(f => f.month === params.month);

  // Level 4: List days
  if (params.day === undefined) {
    const dayMap = new Map<number, number>();
    for (const f of filtered) {
      dayMap.set(f.day, (dayMap.get(f.day) || 0) + 1);
    }
    return {
      path: { subsystemSlug: params.subsystemSlug, year: params.year, month: params.month },
      folders: Array.from(dayMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([day, count]) => ({
          id: `day-${params.subsystemSlug}-${params.year}-${params.month}-${day}`,
          label: String(day).padStart(2, "0"),
          type: "day" as const,
          count,
          subsystemSlug: params.subsystemSlug,
          year: params.year,
          month: params.month,
          day,
        })),
      files: [],
    };
  }

  // Filter by day
  filtered = filtered.filter(f => f.day === params.day);

  // Level 5: List files for the day (Flattened hierarchy: Subsystem -> Year -> Month -> Day -> Files)
  // We skip ReportType and Report folders to show files directly.
  
  return {
    path: params,
    folders: [],
    files: filtered.map((f, idx) => ({
      id: f.file.id || f.file._id || `${f.reportId}-${idx}`,
      originalName: f.file.name || f.file.originalName || f.file.key || "archivo",
      mimeType: f.file.mimeType || f.file.type,
      size: f.file.size,
      url: f.file.url || f.file.previewUrl,
      key: f.file.key,
      reportId: f.reportId,
      reportType: f.reportType,
      date: f.file.createdAt || new Date().toISOString(),
      createdAt: f.file.createdAt || new Date().toISOString(),
      status: "uploaded"
    })),
  };
}

/**
 * Search evidencias across all reports
 */
export async function explorerSearch(params: { q?: string }): Promise<{ query?: string; count: number; results: any[] }> {
  if (!params.q) {
    return { query: params.q, count: 0, results: [] };
  }

  const reports = await getReportsWithEvidencias();
  const query = params.q.toLowerCase();
  const results: any[] = [];

  for (const report of reports) {
    for (const ev of report.evidencias) {
      const name = (ev.name || ev.originalName || ev.key || "").toLowerCase();
      if (name.includes(query)) {
        results.push({
          fileId: ev.id || ev._id,
          originalName: ev.name || ev.originalName || ev.key,
          mimeType: ev.mimeType || ev.type,
          size: ev.size,
          reportId: report.reportId,
          reportType: report.reportType,
          subsystem: report.subsistema,
          subsystemSlug: slugify(report.subsistema),
          year: report.date.getFullYear(),
          month: report.date.getMonth() + 1,
          day: report.date.getDate(),
        });
      }
    }
  }

  return { query: params.q, count: results.length, results };
}

/**
 * Get stats for dashboard
 */
export async function explorerStats(): Promise<{
  totalFiles: number;
  totalSubsystems: number;
  byReportType: { work: number; warehouse: number };
}> {
  const reports = await getReportsWithEvidencias();
  
  let totalFiles = 0;
  const subsystems = new Set<string>();
  let work = 0;
  let warehouse = 0;

  for (const r of reports) {
    const count = r.evidencias.length;
    totalFiles += count;
    subsystems.add(slugify(r.subsistema));
    if (r.reportType === "work") work += count;
    else warehouse += count;
  }

  return {
    totalFiles,
    totalSubsystems: subsystems.size,
    byReportType: { work, warehouse },
  };
}
