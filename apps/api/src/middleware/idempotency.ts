import { Context, Next } from "hono";
import {
  generateRequestHash,
  checkDuplication,
  markInProgress,
} from "../modules/deduplication/deduplication.service";

/**
 * Idempotency middleware for preventing duplicate request processing
 * Uses server-side hash of request body to detect duplicates
 */
export async function idempotencyMiddleware(c: Context, next: Next) {
  const method = c.req.method;
  const path = c.req.path;

  // Only apply to POST /api/reports
  if (method !== "POST" || path !== "/api/reports") {
    return next();
  }

  // Check if idempotency is enabled
  const enabled = process.env.DEDUPLICATION_ENABLED !== "false";
  if (!enabled) {
    return next();
  }

  try {
    // Parse body (only once)
    const body = await c.req.json();

    // Generate hash from request body
    const requestHash = generateRequestHash(body);

    // Check for duplicate request
    const existing = await checkDuplication(requestHash, path, method);

    if (existing) {
      if (existing.status === "in_progress") {
        // Request is currently being processed
        console.log(
          `Duplicate in-progress request detected: ${requestHash.substring(0, 8)}...`,
        );
        return c.json(
          {
            error: "Request already in progress",
            code: "DUPLICATE_IN_PROGRESS",
            message:
              "This report is already being created. Please wait a few seconds and check your reports list.",
            retryAfter: 5,
          },
          409,
        );
      }

      if (existing.status === "completed" && existing.resultData) {
        // Return cached result (within TTL window)
        console.log(
          `Returning cached result for request: ${requestHash.substring(0, 8)}...`,
        );
        return c.json(existing.resultData, 200);
      }

      // If status is "failed", allow retry (will be overwritten)
      if (existing.status === "failed") {
        console.log(
          `Allowing retry for failed request: ${requestHash.substring(0, 8)}...`,
        );
      }
    }

    // Mark request as in-progress
    await markInProgress(requestHash, path, method);
    console.log(
      `Marked request as in-progress: ${requestHash.substring(0, 8)}...`,
    );

    // Store hash and parsed body in context for controller
    c.set("requestHash", requestHash);
    c.set("requestBody", body);

    return next();
  } catch (error) {
    console.error("Idempotency middleware error:", error);
    // Don't block request on middleware errors - fail open
    return next();
  }
}
