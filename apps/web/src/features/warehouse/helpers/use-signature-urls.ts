import { useState, useEffect } from "react";
import { API_URL } from "@/config/env";

/**
 * Hook to convert S3 signature keys to presigned download URLs
 */
export function useSignatureUrls(signatures: {
  firmaQuienRecibe?: string | null;
  firmaAlmacenista?: string | null;
  firmaQuienEntrega?: string | null;
}) {
  const [urls, setUrls] = useState<{
    firmaQuienRecibe?: string | null;
    firmaAlmacenista?: string | null;
    firmaQuienEntrega?: string | null;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setLoading(true);
        const result: typeof urls = {};

        // Fetch each signature URL
        for (const [key, value] of Object.entries(signatures)) {
          if (!value) {
            result[key as keyof typeof result] = null;
            continue;
          }

          // Check if it's already a full URL (base64 or http/https)
          if (
            value.startsWith("data:") ||
            value.startsWith("http://") ||
            value.startsWith("https://")
          ) {
            result[key as keyof typeof result] = value;
            continue;
          }

          // It's an S3 key, fetch presigned URL
          try {
            const response = await fetch(
              `${API_URL}/api/storage/signatures/${value}`,
              {
                method: "GET",
                credentials: "include",
              },
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            result[key as keyof typeof result] = data.url;
          } catch (err) {
            console.error(`Failed to fetch signature URL for ${key}:`, err);
            result[key as keyof typeof result] = null;
          }
        }

        setUrls(result);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch signature URLs"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, [
    signatures.firmaQuienRecibe,
    signatures.firmaAlmacenista,
    signatures.firmaQuienEntrega,
  ]);

  return { urls, loading, error };
}
