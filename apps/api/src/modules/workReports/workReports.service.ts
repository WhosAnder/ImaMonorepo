import {
  NewWorkReport,
  WorkReportFilters,
  PaginationOptions,
  findWorkReportById,
  findWorkReports,
  insertWorkReport,
} from "./workReports.repository";

export async function listWorkReports(
  filters: WorkReportFilters = {},
  pagination?: PaginationOptions,
) {
  return findWorkReports(filters, pagination);
}

export async function getWorkReportById(id: string) {
  return findWorkReportById(id);
}

export async function createWorkReport(data: NewWorkReport) {
  return insertWorkReport(data);
}
