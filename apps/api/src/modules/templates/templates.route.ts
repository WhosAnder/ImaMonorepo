import { Hono } from 'hono';
import {
  createTemplateController,
  getTemplateByIdController,
  getTemplateFiltersController,
  listTemplatesController,
} from './templates.controller';

export const templatesRoute = new Hono();

templatesRoute.get('/filters', getTemplateFiltersController);
templatesRoute.get('/', listTemplatesController);
templatesRoute.get('/:id', getTemplateByIdController);
templatesRoute.post('/', createTemplateController);
