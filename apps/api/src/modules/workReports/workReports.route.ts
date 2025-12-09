import { Hono } from 'hono';
import {
  createWorkReportController,
  getWorkReportByIdController,
  listWorkReportsController,
} from './workReports.controller';

export const workReportsRoute = new Hono();

workReportsRoute.get('/', listWorkReportsController);
workReportsRoute.get('/:id', getWorkReportByIdController);
workReportsRoute.post('/', createWorkReportController);
