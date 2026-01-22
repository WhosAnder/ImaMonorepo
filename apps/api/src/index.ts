import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { workReportsRoute } from "./modules/workReports/workReports.route";
import { warehouseReportsRoute } from "./modules/warehouseReports/warehouseReports.route";
import { templatesRoute } from "./modules/templates/templates.route";
import { warehouseRoute } from "./modules/warehouse/warehouse.route";
import { storageRoute } from "./modules/storage/storage.route";
import { reportsRoute } from "./modules/reports/reports.route";
import { getUploadDir } from "./config/multer";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "hono/logger";

import { workersRoute } from "./modules/workers/workers.route";

const app = new Hono();

app.use("*", logger());

// Enable gzip compression for all responses
app.use("*", compress());

// Enable CORS for the web app
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

// Serve uploaded files (multer) in development/local environments
const isDevelopment = process.env.NODE_ENV !== "production";
if (isDevelopment) {
  app.get("/upload/:filename", async (c) => {
    const filename = c.req.param("filename");
    const filePath = join(getUploadDir(), filename);

    if (!existsSync(filePath)) {
      return c.json({ error: "File not found" }, 404);
    }

    try {
      const fileBuffer = readFileSync(filePath);
      const ext = filename.split(".").pop()?.toLowerCase();

      // Set appropriate content type based on file extension
      const contentTypeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
        mpeg: "video/mpeg",
        mov: "video/quicktime",
        avi: "video/x-msvideo",
      };

      const contentType =
        contentTypeMap[ext || ""] || "application/octet-stream";

      return c.body(fileBuffer, 200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      });
    } catch (error) {
      console.error("Error serving file:", error);
      return c.json({ error: "Error reading file" }, 500);
    }
  });
}

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API routes namespace
const api = new Hono();

// Ping endpoint for testing
api.get("/ping", (c) => c.json({ message: "pong" }));

// Mount report routes
api.route("/reports", workReportsRoute);
api.route("/warehouse-reports", warehouseReportsRoute);
api.route("/warehouse", warehouseRoute);
api.route("/templates", templatesRoute);
api.route("/storage", storageRoute);
api.route("/reports-explorer", reportsRoute);
api.route("/workers", workersRoute);

// Mount API routes under /api prefix
app.route("/api", api);

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 API server starting on http://localhost:${port}`);
console.log(`📊 Health check: http://localhost:${port}/health`);
console.log(`📝 Work reports: http://localhost:${port}/api/reports`);
console.log(
  `📦 Warehouse reports: http://localhost:${port}/api/warehouse-reports`,
);
console.log(`🗂️ Storage: http://localhost:${port}/api/storage/evidences`);
console.log(`\n🌍 Environment: ${process.env.NODE_ENV || "development"}`);

serve({
  fetch: app.fetch,
  port,
});
