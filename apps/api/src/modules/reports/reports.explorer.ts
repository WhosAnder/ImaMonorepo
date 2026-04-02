import {
  getWorkReportCollection,
  getWarehouseReportCollection,
  getUnifiedReportCollection,
} from "../../db/mongo";
import { Collection, Document } from "mongodb";

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

// ============================================================================
// HELPERS
// ============================================================================

const MONTH_NAMES = [
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

function getSafeSlug(text: string): string {
  return (text || "sin-subsistema")
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

/**
 * MongoDB aggregation expression to generate a slug matching getSafeSlug
 * Note: MongoDB doesn't have full regex support for diacritics removal,
 * so we normalize on the JS side when comparing
 */
function buildSubsystemSlugField() {
  return {
    $toLower: {
      $trim: {
        input: {
          $replaceAll: {
            input: { $ifNull: ["$subsistema", "$subsystem", "sin-subsistema"] },
            find: " ",
            replacement: "-",
          },
        },
      },
    },
  };
}

async function getLegacyCollection(
  type: "work" | "warehouse",
): Promise<Collection<Document>> {
  if (type === "work") {
    return getWorkReportCollection() as unknown as Collection<Document>;
  }
  return getWarehouseReportCollection() as unknown as Collection<Document>;
}

// ============================================================================
// AGGREGATION-BASED SERVICE
// ============================================================================

/**
 * Level 1: Get subsystems with counts using aggregation
 */
async function getSubsystemFolders(
  collection: Collection<Document>,
  addMatch?: object
): Promise<ReportExplorerNode[]> {
  const pipeline: any[] = [];
  if (addMatch) pipeline.push({ $match: addMatch });
  pipeline.push(
    {
      $addFields: {
        _subsystemResolved: {
          $let: {
            vars: {
              raw: { $ifNull: ["$subsistema", "$subsystem", ""] },
            },
            in: {
              $cond: [{ $eq: ["$$raw", ""] }, "General", "$$raw"],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$_subsystemResolved",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 as const },
    }
  );

  const results = await collection.aggregate(pipeline).toArray();

  return results.map((r) => {
    const label = r._id as string;
    const slug = getSafeSlug(label);
    return {
      id: slug,
      label,
      type: "subsystem" as const,
      count: r.count as number,
      subsystemSlug: slug,
    };
  });
}

/**
 * Helper to resolve original subsystem name from slug
 */
async function resolveSubsystemFromSlug(
  collection: Collection<Document>,
  slug: string,
): Promise<string | null> {
  const subsystems = await getSubsystemFolders(collection);
  const match = subsystems.find((s) => s.subsystemSlug === slug);
  return match ? match.label : null;
}

/**
 * Level 2: Get years with counts for a subsystem using aggregation
 */
async function getYearFolders(
  collection: Collection<Document>,
  subsystemSlug: string,
  addMatch?: object
): Promise<ReportExplorerNode[]> {
  // Resolve slug to original subsystem name
  const subsystemName = await resolveSubsystemFromSlug(collection, subsystemSlug);
  if (!subsystemName) {
    return [];
  }

  const pipeline: any[] = [];
  if (addMatch) pipeline.push({ $match: addMatch });
  pipeline.push(
    ...[
    {
      $addFields: {
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        $or: [
          { subsistema: subsystemName },
          { subsystem: subsystemName }
        ]
      },
    },
    {
      $group: {
        _id: { $year: "$_dateField" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 as const }, // Newest years first
    }
  ]);

  const results = await collection.aggregate(pipeline).toArray();

  return results.map((r) => {
    const year = r._id as number;
    return {
      id: String(year),
      label: String(year),
      type: "year" as const,
      count: r.count as number,
      subsystemSlug,
      year,
    };
  });
}

/**
 * Level 3: Get months with counts for a subsystem and year using aggregation
 */
async function getMonthFolders(
  collection: Collection<Document>,
  subsystemSlug: string,
  year: number,
  addMatch?: object
): Promise<ReportExplorerNode[]> {
  // Resolve slug to original subsystem name
  const subsystemName = await resolveSubsystemFromSlug(collection, subsystemSlug);
  if (!subsystemName) {
    return [];
  }

  const pipeline: any[] = [];
  if (addMatch) pipeline.push({ $match: addMatch });
  pipeline.push(
    ...[
    {
      $addFields: {
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        $or: [
          { subsistema: subsystemName },
          { subsystem: subsystemName }
        ],
        $expr: { $eq: [{ $year: "$_dateField" }, year] },
      },
    },
    {
      $group: {
        _id: { $month: "$_dateField" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 as const }, // Months in order
    }
  ]);

  const results = await collection.aggregate(pipeline).toArray();

  return results.map((r) => {
    const month = r._id as number;
    return {
      id: String(month),
      label: MONTH_NAMES[month] || String(month),
      type: "month" as const,
      count: r.count as number,
      subsystemSlug,
      year,
      month,
    };
  });
}

/**
 * Level 4: Get days with counts for a subsystem, year, and month using aggregation
 */
async function getDayFolders(
  collection: Collection<Document>,
  subsystemSlug: string,
  year: number,
  month: number,
  addMatch?: object
): Promise<ReportExplorerNode[]> {
  // Resolve slug to original subsystem name
  const subsystemName = await resolveSubsystemFromSlug(collection, subsystemSlug);
  if (!subsystemName) {
    return [];
  }

  const pipeline: any[] = [];
  if (addMatch) pipeline.push({ $match: addMatch });
  pipeline.push(
    ...[
    {
      $addFields: {
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        $or: [
          { subsistema: subsystemName },
          { subsystem: subsystemName }
        ],
        $expr: {
          $and: [
            { $eq: [{ $year: "$_dateField" }, year] },
            { $eq: [{ $month: "$_dateField" }, month] },
          ],
        },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$_dateField" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 as const }, // Newest days first
    }
  ]);

  const results = await collection.aggregate(pipeline).toArray();

  return results.map((r) => {
    const day = r._id as number;
    return {
      id: String(day),
      label: `${day} de ${MONTH_NAMES[month]}`,
      type: "day" as const,
      count: r.count as number,
      subsystemSlug,
      year,
      month,
      day,
    };
  });
}

/**
 * Level 5: Get reports for a specific day (leaf level)
 * Only at this level do we load full report documents
 */
async function getReportsForDay(
  collection: Collection<Document>,
  subsystemSlug: string,
  year: number,
  month: number,
  day: number,
  reportType: "work" | "warehouse",
  addMatch?: object
): Promise<ReportItem[]> {
  // Resolve slug to original subsystem name
  const subsystemName = await resolveSubsystemFromSlug(collection, subsystemSlug);
  if (!subsystemName) {
    return [];
  }

  const pipeline: any[] = [];
  if (addMatch) pipeline.push({ $match: addMatch });
  pipeline.push(
    ...[
    {
      $addFields: {
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        $or: [
          { subsistema: subsystemName },
          { subsystem: subsystemName }
        ],
        $expr: {
          $and: [
            { $eq: [{ $year: "$_dateField" }, year] },
            { $eq: [{ $month: "$_dateField" }, month] },
            { $eq: [{ $dayOfMonth: "$_dateField" }, day] },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        folio: 1,
        subsistema: { $ifNull: ["$subsistema", "$subsystem"] },
        createdAt: 1,
        fecha: 1,
        status: 1,
        realizadoPor: { $ifNull: ["$realizadoPor", "$data.responsable"] },
        solicitante: { $ifNull: ["$solicitante", "$data.solicitante"] },
        actividadRealizada: { $ifNull: ["$actividadRealizada", "$data.observacionesActividad", "$data.observacionesGenerales"] },
        responsableRecepcion: { $ifNull: ["$responsableRecepcion", "$data.nombreQuienRecibe"] },
      },
    },
    {
      $sort: { _dateField: -1 as const },
    }
  ]);

  const results = await collection.aggregate(pipeline).toArray();

  return results.map((r) => ({
    id: r._id.toString(),
    reportId: r._id.toString(),
    folio: r.folio || "S/F",
    subsystem: r.subsistema || "General",
    date: (r.createdAt || r.fecha || new Date()).toString(),
    status: r.status || "completed",
    author: reportType === "work" ? r.realizadoPor : r.solicitante,
    description:
      reportType === "work"
        ? r.actividadRealizada
        : `Entrega a: ${r.responsableRecepcion}`,
  }));
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export async function explorerListReports(
  params: ReportExplorerParams,
): Promise<ReportExplorerResponse> {
  const legacyCollection = await getLegacyCollection(params.type);
  const unifiedCollection = await getUnifiedReportCollection();

  // Helper to run pipeline on both collections and merge
  async function runOnBoth<T>(
    fn: (col: Collection<Document>, addMatch?: object) => Promise<T[]>
  ): Promise<T[]> {
    const [legacy, unified] = await Promise.all([
      fn(legacyCollection),
      fn(unifiedCollection, { reportType: params.type })
    ]);
    return [...legacy, ...unified];
  }

  // Level 1: Subsystems
  if (!params.subsystemSlug) {
    const raw = await runOnBoth(c => getSubsystemFolders(c));
    const merged = Array.from(raw.reduce((acc, curr) => {
      const ex = acc.get(curr.id) || { ...curr, count: 0 };
      ex.count += curr.count;
      acc.set(curr.id, ex);
      return acc;
    }, new Map<string, ReportExplorerNode>()).values());
    
    return { path: params, folders: merged.sort((a,b) => a.id.localeCompare(b.id)), reports: [] };
  }

  // Level 2: Years
  if (params.year === undefined) {
    const raw = await runOnBoth(c => getYearFolders(c, params.subsystemSlug!));
    const merged = Array.from(raw.reduce((acc, curr) => {
      const ex = acc.get(curr.id) || { ...curr, count: 0 };
      ex.count += curr.count;
      acc.set(curr.id, ex);
      return acc;
    }, new Map<string, ReportExplorerNode>()).values());
    
    return { path: params, folders: merged.sort((a,b) => (b.year||0) - (a.year||0)), reports: [] };
  }

  // Level 3: Months
  if (params.month === undefined) {
    const raw = await runOnBoth(c => getMonthFolders(c, params.subsystemSlug!, params.year!));
    const merged = Array.from(raw.reduce((acc, curr) => {
      const ex = acc.get(curr.id) || { ...curr, count: 0 };
      ex.count += curr.count;
      acc.set(curr.id, ex);
      return acc;
    }, new Map<string, ReportExplorerNode>()).values());
    
    return { path: params, folders: merged.sort((a,b) => (a.month||0) - (b.month||0)), reports: [] };
  }

  // Level 4: Days
  if (params.day === undefined) {
    const raw = await runOnBoth(c => getDayFolders(c, params.subsystemSlug!, params.year!, params.month!));
    const merged = Array.from(raw.reduce((acc, curr) => {
      const ex = acc.get(curr.id) || { ...curr, count: 0 };
      ex.count += curr.count;
      acc.set(curr.id, ex);
      return acc;
    }, new Map<string, ReportExplorerNode>()).values());
    
    return { path: params, folders: merged.sort((a,b) => (b.day||0) - (a.day||0)), reports: [] };
  }

  // Level 5: Reports
  const rawReports = await runOnBoth(c => getReportsForDay(c, params.subsystemSlug!, params.year!, params.month!, params.day!, params.type));
  // Deduplicate and sort by date descending
  const uniqueReports = Array.from(new Map(rawReports.map(r => [r.id, r])).values());
  uniqueReports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    path: params,
    folders: [],
    reports: uniqueReports,
  };
}