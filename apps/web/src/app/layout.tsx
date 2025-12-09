import type { Metadata } from "next";
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
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
