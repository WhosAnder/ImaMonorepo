"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/lib/api';
import { themes } from '@/shared/theme/colors';
import { Plus, Package, Clock, TrendingUp } from 'lucide-react';
import type { WarehouseReportListItem } from '@/features/almacen/types/warehouseReportList';

export function WarehouseDashboard() {
    const themeColor = themes.warehouse.primary;
    
    const { data: warehouseReports = [] } = useQuery<WarehouseReportListItem[]>({
        queryKey: ["warehouseReports"],
        queryFn: () => apiGet("/warehouse-reports")
    });

    const totalWarehouseReports = warehouseReports.length;
    const recentReports = warehouseReports.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de almacén</h1>
                <p className="text-sm text-gray-500 mt-1">Resumen de movimientos y reportes de almacén.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Reportes de almacén"
                    value={totalWarehouseReports}
                    icon={Package}
                    color={themeColor}
                />
                <StatCard
                    title="Movimientos recientes"
                    value={recentReports.length}
                    icon={Clock}
                    color={themeColor}
                />
                <StatCard
                    title="Subsistemas activos"
                    value={3}
                    icon={TrendingUp}
                    color={themeColor}
                />
            </div>

            {/* Recent Warehouse Reports */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Reportes recientes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subsistema</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Entrega</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Almacenista</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quien Recibe</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.folio}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.subsistema}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.fechaEntrega}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.responsableAlmacen}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.responsableRecepcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/almacen/${report.id}`} className="hover:underline" style={{ color: themeColor }}>
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link
                        href="/almacen/new"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: themeColor, color: themeColor }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Nuevo reporte de almacén</span>
                    </Link>
                    <Link
                        href="/almacen"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: themeColor, color: themeColor }}
                    >
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Ver todos los reportes</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
            </div>
        </div>
    );
}

