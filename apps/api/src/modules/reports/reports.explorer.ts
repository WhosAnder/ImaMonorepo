import {
  getWorkReportCollection,
  getWarehouseReportCollection,
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
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

async function getCollection(
  type: "work" | "warehouse",
): Promise<Collection<Document>> {
  if (type === "work") {
    return getWorkReportCollection();
  }
  return getWarehouseReportCollection();
}

// ============================================================================
// AGGREGATION-BASED SERVICE
// ============================================================================

/**
 * Level 1: Get subsystems with counts using aggregation
 */
async function getSubsystemFolders(
  collection: Collection<Document>,
): Promise<ReportExplorerNode[]> {
  const pipeline = [
    {
      $group: {
        _id: { $ifNull: ["$subsistema", "General"] },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 as const },
    },
  ];

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
 * Level 2: Get years with counts for a subsystem using aggregation
 */
async function getYearFolders(
  collection: Collection<Document>,
  subsystemSlug: string,
): Promise<ReportExplorerNode[]> {
  const pipeline = [
    {
      $addFields: {
        _subsystemSlug: {
          $toLower: {
            $trim: {
              input: {
                $replaceAll: {
                  input: { $ifNull: ["$subsistema", "sin-subsistema"] },
                  find: " ",
                  replacement: "-",
                },
              },
            },
          },
        },
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        _subsystemSlug: subsystemSlug,
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
    },
  ];

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
): Promise<ReportExplorerNode[]> {
  const pipeline = [
    {
      $addFields: {
        _subsystemSlug: {
          $toLower: {
            $trim: {
              input: {
                $replaceAll: {
                  input: { $ifNull: ["$subsistema", "sin-subsistema"] },
                  find: " ",
                  replacement: "-",
                },
              },
            },
          },
        },
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        _subsystemSlug: subsystemSlug,
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
    },
  ];

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
): Promise<ReportExplorerNode[]> {
  const pipeline = [
    {
      $addFields: {
        _subsystemSlug: {
          $toLower: {
            $trim: {
              input: {
                $replaceAll: {
                  input: { $ifNull: ["$subsistema", "sin-subsistema"] },
                  find: " ",
                  replacement: "-",
                },
              },
            },
          },
        },
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        _subsystemSlug: subsystemSlug,
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
    },
  ];

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
): Promise<ReportItem[]> {
  const pipeline = [
    {
      $addFields: {
        _subsystemSlug: {
          $toLower: {
            $trim: {
              input: {
                $replaceAll: {
                  input: { $ifNull: ["$subsistema", "sin-subsistema"] },
                  find: " ",
                  replacement: "-",
                },
              },
            },
          },
        },
        _dateField: { $ifNull: ["$createdAt", "$fecha"] },
      },
    },
    {
      $match: {
        _subsystemSlug: subsystemSlug,
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
        subsistema: 1,
        createdAt: 1,
        fecha: 1,
        status: 1,
        realizadoPor: 1,
        solicitante: 1,
        actividadRealizada: 1,
        responsableRecepcion: 1,
      },
    },
    {
      $sort: { _dateField: -1 as const },
    },
  ];

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
  const collection = await getCollection(params.type);

  // Level 1: Subsystems (root level)
  if (!params.subsystemSlug) {
    const folders = await getSubsystemFolders(collection);
    return {
      path: params,
      folders,
      reports: [],
    };
  }

  // Level 2: Years
  if (params.year === undefined) {
    const folders = await getYearFolders(collection, params.subsystemSlug);
    return {
      path: params,
      folders,
      reports: [],
    };
  }

  // Level 3: Months
  if (params.month === undefined) {
    const folders = await getMonthFolders(
      collection,
      params.subsystemSlug,
      params.year,
    );
    return {
      path: params,
      folders,
      reports: [],
    };
  }

  // Level 4: Days
  if (params.day === undefined) {
    const folders = await getDayFolders(
      collection,
      params.subsystemSlug,
      params.year,
      params.month,
    );
    return {
      path: params,
      folders,
      reports: [],
    };
  }

  // Level 5: Reports (leaf level)
  const reports = await getReportsForDay(
    collection,
    params.subsystemSlug,
    params.year,
    params.month,
    params.day,
    params.type,
  );

  return {
    path: params,
    folders: [],
    reports,
  };
}
