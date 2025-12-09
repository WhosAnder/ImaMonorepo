"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/lib/api';
import { themes } from '@/shared/theme/colors';
import { Plus, FileText, Clock, TrendingUp } from 'lucide-react';
import type { WorkReportListItem } from '@/features/reports/types/workReportList';

export function SupervisorDashboard() {
    const themeColor = themes.work.primary;
    
    const { data: workReports = [] } = useQuery<WorkReportListItem[]>({
        queryKey: ["workReports"],
        queryFn: () => apiGet("/reports")
    });

    const totalWorkReports = workReports.length;
    const recentReports = workReports.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de supervisor</h1>
                <p className="text-sm text-gray-500 mt-1">Resumen de reportes de trabajo.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Reportes de trabajo"
                    value={totalWorkReports}
                    icon={FileText}
                    color={themeColor}
                />
                <StatCard
                    title="Reportes del día"
                    value={2}
                    icon={Clock}
                    color={themeColor}
                />
                <StatCard
                    title="Reportes recientes"
                    value={recentReports.length}
                    icon={TrendingUp}
                    color={themeColor}
                />
            </div>

            {/* Recent Work Reports */}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.folio}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.subsistema}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.fecha}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.responsable}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.turno === 'Matutino' ? 'bg-yellow-100 text-yellow-800' :
                                                report.turno === 'Vespertino' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-indigo-100 text-indigo-800'
                                            }`}>
                                            {report.turno}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/reports/${report.id}`} className="hover:underline" style={{ color: themeColor }}>
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
                        href="/reports/new"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: themeColor, color: themeColor }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Nuevo reporte de trabajo</span>
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

