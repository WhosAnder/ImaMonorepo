"use client";
import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { AppLayout } from '@/shared/layout/AppLayout';
import { WarehouseReportPreview } from '../components/WarehouseReportPreview';
import { ArrowLeft } from 'lucide-react';
import { useWarehouseReportQuery } from '@/hooks/useWarehouseReports';

export const WarehouseReportDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: report, isLoading, error } = useWarehouseReportQuery(id || '');

    if (isLoading) {
        return (
            <AppLayout title="Cargando...">
                <div className="flex items-center justify-center h-[60vh]">
                    <p className="text-gray-500">Cargando reporte...</p>
                </div>
            </AppLayout>
        );
    }

    if (error || !report) {
        return (
            <AppLayout title="Reporte de almacén no encontrado">
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <h1 className="text-2xl font-bold text-gray-800">Reporte no encontrado</h1>
                    <p className="text-gray-500">El reporte que buscas no existe o no está disponible.</p>
                    <Button variant="secondary" onClick={() => router.push('/almacen')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a la lista
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={`Reporte ${report.subsistema}`}>
            <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/almacen')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Detalle de Reporte</h1>
                            <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                <span>{report.subsistema}</span>
                                <span>•</span>
                                <span>{report.nombreAlmacenista}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 p-8 rounded-xl border border-gray-200 shadow-inner overflow-auto">
                    <div className="mx-auto" style={{ width: '816px' }}> {/* Letter width */}
                        <WarehouseReportPreview values={report} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};
