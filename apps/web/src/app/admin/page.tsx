import { AppLayout } from "@/shared/layout/AppLayout";
import { Users, FileText, Package } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <AppLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
            <p className="text-sm text-gray-500">Gestionar usuarios y roles</p>
          </div>
        </Link>

        <Link
          href="/reports"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="p-4 bg-green-100 rounded-full text-green-600">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Reportes de Trabajo
            </h3>
            <p className="text-sm text-gray-500">Ver reportes de mantenimiento</p>
          </div>
        </Link>

        <Link
          href="/warehouse"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="p-4 bg-orange-100 rounded-full text-orange-600">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Reportes de Almacén
            </h3>
            <p className="text-sm text-gray-500">Gestionar inventario</p>
          </div>
        </Link>
      </div>
    </AppLayout>
  );
}
