export const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:5001";

// Gateway is the single entry point for all backend services
export const GATEWAY_URL = (
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"
);

// Microservices via gateway
export const WAREHOUSE_URL = `${GATEWAY_URL}/warehouse`;
export const REPORTS_URL = `${GATEWAY_URL}/reports`;

// Legacy monolith via gateway (templates, storage, workers, explorer, drafts)
export const API_URL = GATEWAY_URL;

export const S3_PRESIGNER_BASE =
  process.env.NEXT_PUBLIC_S3_PRESIGNER_BASE ?? API_URL;
