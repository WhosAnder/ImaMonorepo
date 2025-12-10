import type { Metadata } from "next";
import Script from "next/script";
import "../index.css";
import { QueryProvider } from "@/shared/query/QueryProvider";
import { AuthProvider } from "@/auth/AuthContext";

export const metadata: Metadata = {
  title: "IMA Cloud",
  description: "Gestión de archivos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
