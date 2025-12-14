import { getWorkReportCollection, getWarehouseReportCollection } from "../../db/mongo";
import slugify from "slugify";
import { WithId, Document } from "mongodb";

// ============================================================================
// TYPES
// ============================================================================

export interface ReportExplorerNode {
  id: string;
  label: string;
  type: "subsystem" | "year" | "month" | "day" | "report";
  count: number;
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
}

export interface ReportItem {
  id: string;
  reportId: string;
  folio: string;
  subsystem: string;
  date: string;
  status: string;
  author?: string;
  description?: string;
}

export interface ReportExplorerParams {
  type: "work" | "warehouse";
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
}

export interface ReportExplorerResponse {
  path: ReportExplorerParams;
  folders: ReportExplorerNode[];
  reports: ReportItem[];
}

interface ExtendedReport extends Document {
  _year?: number;
  _month?: number;
  _day?: number;
  _subsystem?: string;
  _subsystemSlug?: string;
  createdAt?: string | Date;
  fecha?: string | Date;
  subsistema?: string;
  folio?: string;
  status?: string;
  realizadoPor?: string;
  solicitante?: string;
  actividadRealizada?: string;
  responsableRecepcion?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function getSafeSlug(text: string): string {
  return (text || "sin-subsistema")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

// ============================================================================
// SERVICE
// ============================================================================

export async function explorerListReports(params: ReportExplorerParams): Promise<ReportExplorerResponse> {
  let allReports: any[] = [];
  
  if (params.type === "work") {
    const collection = await getWorkReportCollection();
    allReports = await collection.find({}).toArray();
  } else {
    const collection = await getWarehouseReportCollection();
    allReports = await collection.find({}).toArray();
  }

  // Map to a common structure
  const items: ExtendedReport[] = allReports.map((r: any) => {
    const dateObj = new Date(r.createdAt || r.fecha || new Date());
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const subsystem = r.subsistema || "General";
    const subsystemSlug = getSafeSlug(subsystem);

    return {
      ...r,
      _year: year,
      _month: month,
      _day: day,
      _subsystem: subsystem,
      _subsystemSlug: subsystemSlug,
    };
  });

  let filtered = items;

  // Level 1: Subsystems
  if (!params.subsystemSlug) {
    const subsystems = new Map<string, { label: string; count: number; slug: string }>();
    
    filtered.forEach(item => {
      const slug = item._subsystemSlug!;
      if (!subsystems.has(slug)) {
        subsystems.set(slug, { label: item._subsystem!, count: 0, slug });
      }
      subsystems.get(slug)!.count++;
    });

    return {
      path: params,
      folders: Array.from(subsystems.values()).map(s => ({
        id: s.slug,
        label: s.label,
        type: "subsystem" as const,
        count: s.count,
        subsystemSlug: s.slug,
      })),
      reports: [],
    };
  }

  // Filter by subsystem
  filtered = filtered.filter(f => f._subsystemSlug === params.subsystemSlug);

  // Level 2: Years
  if (params.year === undefined) {
    const years = new Map<number, number>();
    filtered.forEach(item => {
      const y = item._year!;
      years.set(y, (years.get(y) || 0) + 1);
    });

    return {
      path: params,
      folders: Array.from(years.entries()).map(([year, count]) => ({
        id: String(year),
        label: String(year),
        type: "year" as const,
        count,
        subsystemSlug: params.subsystemSlug,
        year,
      })).sort((a, b) => b.year! - a.year!), // Newest years first
      reports: [],
    };
  }

  // Filter by year
  filtered = filtered.filter(f => f._year === params.year);

  // Level 3: Months
  if (params.month === undefined) {
    const months = new Map<number, number>();
    filtered.forEach(item => {
      const m = item._month!;
      months.set(m, (months.get(m) || 0) + 1);
    });

    return {
      path: params,
      folders: Array.from(months.entries()).map(([month, count]) => ({
        id: String(month),
        label: MONTH_NAMES[month] || String(month),
        type: "month" as const,
        count,
        subsystemSlug: params.subsystemSlug,
        year: params.year,
        month,
      })).sort((a, b) => a.month! - b.month!),
      reports: [],
    };
  }

  // Filter by month
  filtered = filtered.filter(f => f._month === params.month);

  // Level 4: Days
  if (params.day === undefined) {
    const days = new Map<number, number>();
    filtered.forEach(item => {
      const d = item._day!;
      days.set(d, (days.get(d) || 0) + 1);
    });

    return {
      path: params,
      folders: Array.from(days.entries()).map(([day, count]) => ({
        id: String(day),
        label: `${day} de ${MONTH_NAMES[params.month!]}`,
        type: "day" as const,
        count,
        subsystemSlug: params.subsystemSlug,
        year: params.year,
        month: params.month,
        day,
      })).sort((a, b) => b.day! - a.day!), // Newest days first
      reports: [],
    };
  }

  // Filter by day
  filtered = filtered.filter(f => f._day === params.day);

  // Level 5: Reports List (Leaf)
  return {
    path: params,
    folders: [],
    reports: filtered.map(r => ({
      id: r._id.toString(),
      reportId: r._id.toString(),
      folio: r.folio || "S/F",
      subsystem: r.subsistema || "General",
      date: (r.createdAt || r.fecha || new Date()).toString(),
      status: r.status || "completed", // Default to completed for now
      author: params.type === "work" ? r.realizadoPor : r.solicitante,
      description: params.type === "work" ? r.actividadRealizada : `Entrega a: ${r.responsableRecepcion}`,
    })),
  };
}
