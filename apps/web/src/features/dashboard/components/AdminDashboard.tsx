"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/lib/api';
import { themes } from '@/shared/theme/colors';
import { Plus, FileText, Package, TrendingUp } from 'lucide-react';
import type { WorkReportListItem } from '@/features/reports/types/workReportList';
import type { WarehouseReportListItem } from '@/features/almacen/types/warehouseReportList';

export function AdminDashboard() {
    const themeColor = themes.admin.primary;
    
    const { data: workReports = [] } = useQuery<WorkReportListItem[]>({
        queryKey: ["workReports"],
        queryFn: () => apiGet("/reports")
    });

    const { data: warehouseReports = [] } = useQuery<WarehouseReportListItem[]>({
        queryKey: ["warehouseReports"],
        queryFn: () => apiGet("/warehouse-reports")
    });

    const totalWorkReports = workReports.length;
    const totalWarehouseReports = warehouseReports.length;
    const totalReports = totalWorkReports + totalWarehouseReports;

    // Merge recent reports from both modules
    const recentActivity = [
        ...workReports.slice(0, 3).map(r => ({ ...r, type: 'Trabajo' as const, href: `/reports/${r.id}` })),
        ...warehouseReports.slice(0, 3).map(r => ({ ...r, type: 'Almacén' as const, href: `/almacen/${r.id}`, fecha: r.fechaEntrega })),
    ].slice(0, 6);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel general</h1>
                <p className="text-sm text-gray-500 mt-1">Resumen global de reportes y módulos.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Reportes de trabajo"
                    value={totalWorkReports}
                    icon={FileText}
                    color={themes.work.primary}
                />
                <StatCard
                    title="Reportes de almacén"
                    value={totalWarehouseReports}
                    icon={Package}
                    color={themes.warehouse.primary}
                />
                <StatCard
                    title="Total de reportes"
                    value={totalReports}
                    icon={TrendingUp}
                    color={themeColor}
                />
                <StatCard
                    title="Módulos activos"
                    value={2}
                    icon={FileText}
                    color={themeColor}
                />
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad reciente</h2>
                <div className="space-y-3">
                    {recentActivity.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                                        style={{ backgroundColor: item.type === 'Trabajo' ? themes.work.primary : themes.warehouse.primary }}
                                    >
                                        {item.type}
                                    </span>
                                    <span className="font-medium text-gray-900">{item.folio}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{item.subsistema}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.fecha}</p>
                            </div>
                            <Link href={item.href} className="text-sm font-medium hover:underline" style={{ color: themeColor }}>
                                Ver
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                        href="/reports/new"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: themes.work.primary, color: themes.work.primary }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Nuevo reporte de trabajo</span>
                    </Link>
                    <Link
                        href="/almacen/new"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: themes.warehouse.primary, color: themes.warehouse.primary }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Nuevo reporte de almacén</span>
                    </Link>
                    <Link
                        href="/reports"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: themeColor, color: themeColor }}
                    >
                        <FileText className="w-4 h-4" />
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

