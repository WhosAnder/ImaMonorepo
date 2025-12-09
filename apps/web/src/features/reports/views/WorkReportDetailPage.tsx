
"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { AppLayout } from '@/shared/layout/AppLayout';
import { ArrowLeft } from 'lucide-react';
import { WorkReportPreview } from '../components/WorkReportPreview';
import { useWorkReportQuery } from '@/hooks/useWorkReports';

export const WorkReportDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: report, isLoading, error } = useWorkReportQuery(id || '');

    if (isLoading) {
        return <div className="p-8 text-center">Cargando reporte...</div>;
    }

    if (error || !report) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 mb-4">Reporte no encontrado</p>
                <Button variant="secondary" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a la lista
                </Button>
            </div>
        );
    }

    return (
        <AppLayout title="Detalle de Reporte">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/reports')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detalle de Reporte</h1>
                        <p className="text-gray-500">Folio: {report.folio}</p>
                    </div>
                </div>

                <WorkReportPreview values={report} />
            </div>
        </AppLayout>
    );
};
