
"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from 'react';
import { Search, Filter, Plus, Package, Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from "@/shared/ui/Button";
import { useRouter } from 'next/navigation';
import { useWarehouseReportsQuery } from '@/hooks/useWarehouseReports';
import { AppLayout } from "@/shared/layout/AppLayout";

export const WarehouseReportsListPage: React.FC = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: warehouseReports, isLoading, error } = useWarehouseReportsQuery();

    const filteredReports = warehouseReports?.filter(report => {
        const matchesSearch =
            report.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.subsistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.responsableAlmacen.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    if (isLoading) {
        return <div className="p-8 text-center">Cargando reportes de almacén...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">Error al cargar reportes de almacén</div>;
    }

    return (
        <AppLayout title="Reportes de Almacén">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reportes de Almacén</h1>
                        <p className="text-gray-500">Gestiona y consulta las entregas de material</p>
                    </div>
                    <Button onClick={() => router.push('/almacen/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Entrega
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por folio, subsistema o responsable..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">Todos los turnos</option>
                                    <option value="matutino">Matutino</option>
                                    <option value="vespertino">Vespertino</option>
                                    <option value="nocturno">Nocturno</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Folio</th>
                                    <th className="px-6 py-3 font-medium">Subsistema</th>
                                    <th className="px-6 py-3 font-medium">Fecha Entrega</th>
                                    <th className="px-6 py-3 font-medium">Almacenista</th>
                                    <th className="px-6 py-3 font-medium">Recibe</th>
                                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredReports?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No se encontraron reportes que coincidan con tu búsqueda
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports?.map((report) => (
                                        <tr key={report.id} className="bg-white hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-blue-600">
                                                {report.folio}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                <div className="flex items-center">
                                                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                                                    {report.subsistema}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                    {report.fechaEntrega}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                                    {report.responsableAlmacen}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {report.responsableRecepcion}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    onClick={() => router.push(`/almacen/${report.id}`)}
                                                >
                                                    Ver detalle
                                                    <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                        <span>Mostrando {filteredReports?.length || 0} reportes</span>
                        <div className="flex gap-2">
                            <Button variant="secondary" disabled>Anterior</Button>
                            <Button variant="secondary" disabled>Siguiente</Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};
