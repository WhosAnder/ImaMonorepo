import {
  NewWorkReport,
  WorkReportFilters,
  findWorkReportById,
  findWorkReports,
  insertWorkReport,
} from './workReports.repository';

export async function listWorkReports(filters: WorkReportFilters = {}) {
  return findWorkReports(filters);
}

export async function getWorkReportById(id: string) {
  return findWorkReportById(id);
}

export async function createWorkReport(data: NewWorkReport) {
  return insertWorkReport(data);
}
