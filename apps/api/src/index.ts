import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { workReportsRoute } from './modules/workReports/workReports.route';
import { warehouseReportsRoute } from './modules/warehouseReports/warehouseReports.route';
import { templatesRoute } from './modules/templates/templates.route';
import { warehouseRoute } from './modules/warehouse/warehouse.route';

import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());

// Enable CORS for the web app
app.use('/*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes namespace
const api = new Hono();

// Ping endpoint for testing
api.get('/ping', (c) => c.json({ message: 'pong' }));

// Mount report routes
api.route('/reports', workReportsRoute);
api.route('/warehouse-reports', warehouseReportsRoute);
api.route('/warehouse', warehouseRoute);
api.route('/templates', templatesRoute);

// Mount API routes under /api prefix
app.route('/api', api);

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 API server starting on http://localhost:${port}`);
console.log(`📊 Health check: http://localhost:${port}/health`);
console.log(`📝 Work reports: http://localhost:${port}/api/reports`);
console.log(`📦 Warehouse reports: http://localhost:${port}/api/warehouse-reports`);

serve({
  fetch: app.fetch,
  port
});
