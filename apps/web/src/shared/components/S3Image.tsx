import { useEffect, useState } from "react";
import { API_URL } from "@/config/env";

interface S3ImageProps {
  s3Key: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Component that fetches and displays an image from S3 using presigned download URLs
 * Works for both signatures and evidences
 */
export function S3Image({
  s3Key,
  alt = "Image",
  className = "",
  fallback,
}: S3ImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no key or key is already a base64/http URL, use it directly
    if (!s3Key) {
      setIsLoading(false);
      return;
    }

    console.log("[S3Image] Loading image with key:", s3Key);

    // If it's already a data URL or http URL, use it directly (for backward compatibility)
    if (s3Key.startsWith("data:") || s3Key.startsWith("http")) {
      console.log("[S3Image] Using direct URL (base64 or http)");
      setImageUrl(s3Key);
      setIsLoading(false);
      return;
    }

    // Fetch presigned URL from backend
    const fetchPresignedUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine if it's a signature or evidence based on key prefix
        const isSignature = s3Key.startsWith("signatures/");

        let url: string;

        if (isSignature) {
          // For signatures, use the signature endpoint (wildcard route handles slashes)
          const fetchUrl = `${API_URL}/api/storage/signatures/${s3Key}`;
          console.log("[S3Image] Fetching signature URL:", fetchUrl);

          const response = await fetch(fetchUrl, {
            method: "GET",
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "[S3Image] Failed to get presigned URL:",
              response.status,
              errorText,
            );
            throw new Error(`Failed to get presigned URL: ${response.status}`);
          }

          const data = await response.json();
          console.log("[S3Image] Received presigned URL:", data.url);
          url = data.url;
        } else {
          // For evidences, use the presign-download endpoint
          const response = await fetch(
            `${API_URL}/api/storage/presign-download`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ key: s3Key }),
            },
          );

          if (!response.ok) {
            throw new Error("Failed to get presigned URL");
          }

          const data = await response.json();
          url = data.url;
        }

        setImageUrl(url);
      } catch (err) {
        console.error("Error fetching presigned URL:", err);
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [s3Key]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-400">Cargando...</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-400">Sin imagen</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => {
        setError("Failed to load image");
        setImageUrl(null);
      }}
    />
  );
}
