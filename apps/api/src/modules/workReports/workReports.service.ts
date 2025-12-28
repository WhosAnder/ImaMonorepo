import {
  NewWorkReport,
  WorkReportFilters,
  PaginationOptions,
  UpdateWorkReportInput,
  findWorkReportById,
  findWorkReports,
  insertWorkReport,
  updateWorkReportById,
  deleteWorkReportById,
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

export async function updateWorkReport(id: string, data: UpdateWorkReportInput) {
  return updateWorkReportById(id, data);
}

export async function deleteWorkReport(id: string) {
  return deleteWorkReportById(id);
}
