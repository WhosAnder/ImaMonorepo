import React from 'react';
import { WarehouseReportFormValues } from '../schemas/warehouseReportSchema';
import { themes } from '@/shared/theme/colors';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export type WarehouseReportPreviewProps = {
    values: DeepPartial<WarehouseReportFormValues>;
};

export function WarehouseReportPreview({ values }: WarehouseReportPreviewProps) {
    const {
        subsistema,
        fechaHoraEntrega,
        turno,
        nombreQuienRecibe,
        nombreAlmacenista,
        herramientas,
        refacciones,
        observacionesGenerales,
        fechaHoraRecepcion,
        nombreQuienEntrega,
        nombreAlmacenistaCierre,
        firmaQuienRecibe,
        firmaAlmacenista,
        firmaQuienEntrega,
    } = values;

    const primaryColor = themes.warehouse.primary;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="rounded-xl border bg-white shadow-sm p-4 sticky top-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
                Vista previa del reporte
            </h2>

            {/* Outer page & frame */}
            <div className="relative mx-auto w-full max-w-[750px] aspect-[8.5/11] bg-gray-900 p-4 text-xs leading-relaxed shadow-md overflow-hidden">
                <div
                    className="relative h-full w-full rounded-[24px] border-[3px] bg-[#f5f7ff] overflow-hidden flex flex-col"
                    style={{ borderColor: '#F0493B' }} // Red border as requested
                >

                    {/* Watermark */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
                        <span className="select-none text-[90px] font-bold text-gray-400/10 rotate-[-25deg] tracking-wider">
                            ALMACÉN IMA
                        </span>
                    </div>

                    {/* Content Wrapper */}
                    <div className="relative z-10 h-full w-full flex flex-col bg-transparent">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-3">
                            <div className="h-10 w-32 flex items-center justify-start">
                                {/* Logo placeholder logic similar to WorkReport */}
                                <img
                                    src="/logo-ima.png"
                                    alt="Logo IMA"
                                    className="h-10 w-auto object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden h-10 w-28 text-white text-xs font-semibold rounded-md flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                                    LOGO IMA
                                </div>
                            </div>
                            <div className="text-right text-[11px] leading-tight" style={{ color: primaryColor }}>
                                <div className="font-semibold">Formato de almacén proyecto</div>
                                <div className="uppercase text-[10px] tracking-wide">AEROTREN AICM</div>
                            </div>
                        </div>
                        <div className="mx-6 h-[2px] rounded-full" style={{ backgroundColor: primaryColor }} />

                        <div className="flex-1 overflow-y-auto">

                            {/* General Data */}
                            <div className="mt-4 space-y-2 px-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <LabeledPill label="SUBSISTEMA" value={subsistema} color={primaryColor} />
                                    <LabeledPill label="FECHA Y HORA DE ENTREGA" value={formatDate(fechaHoraEntrega)} color={primaryColor} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <LabeledPill label="TURNO" value={turno} color={primaryColor} />
                                    <LabeledPill label="NOMBRE ALMACENISTA" value={nombreAlmacenista} color={primaryColor} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <LabeledPill label="NOMBRE QUIEN RECIBE" value={nombreQuienRecibe} color={primaryColor} />
                                    {/* Filler to balance grid if needed */}
                                    <div />
                                </div>
                            </div>

                            {/* Herramientas */}
                            <section className="mt-5 px-6">
                                <div className="rounded-t-md px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                                    HERRAMIENTAS QUE SE ENTREGAN
                                </div>
                                <div className="rounded-b-md border bg-white px-3 py-2 text-[10px] space-y-1" style={{ borderColor: primaryColor, color: primaryColor }}>
                                    {herramientas && herramientas.length > 0 ? (
                                        <div className="space-y-2">
                                            {herramientas.map((item, idx) => (
                                                <div key={item.id || idx} className="border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                                    <div className="flex justify-between font-semibold">
                                                        <span>{item.name}</span>
                                                        <span>{item.units} un.</span>
                                                    </div>
                                                    <div className="text-[9px] text-gray-500">{item.observations || 'Sin observaciones'}</div>
                                                    <div className="text-[9px] text-gray-400">Evidencias: {item.evidences?.length || 0} / 5 fotos</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-2 text-gray-400 italic">Sin herramientas registradas</div>
                                    )}
                                </div>
                            </section>

                            {/* Refacciones */}
                            <section className="mt-5 px-6">
                                <div className="rounded-t-md px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                                    REFACCIONES QUE SE ENTREGAN
                                </div>
                                <div className="rounded-b-md border bg-white px-3 py-2 text-[10px] space-y-1" style={{ borderColor: primaryColor, color: primaryColor }}>
                                    {refacciones && refacciones.length > 0 ? (
                                        <div className="space-y-2">
                                            {refacciones.map((item, idx) => (
                                                <div key={item.id || idx} className="border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                                    <div className="flex justify-between font-semibold">
                                                        <span>{item.name}</span>
                                                        <span>{item.units} un.</span>
                                                    </div>
                                                    <div className="text-[9px] text-gray-500">{item.observations || 'Sin observaciones'}</div>
                                                    <div className="text-[9px] text-gray-400">Evidencias: {item.evidences?.length || 0} / 5 fotos</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-2 text-gray-400 italic">Sin refacciones registradas</div>
                                    )}
                                </div>
                            </section>

                            {/* Observaciones Generales */}
                            <section className="mt-5 px-6">
                                <div className="rounded-t-md px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                                    OBSERVACIONES GENERALES
                                </div>
                                <div className="min-h-[60px] rounded-b-md border bg-white px-3 py-2 text-[10px] whitespace-pre-wrap" style={{ borderColor: primaryColor, color: primaryColor }}>
                                    {observacionesGenerales && observacionesGenerales.trim().length > 0
                                        ? observacionesGenerales
                                        : "—"}
                                </div>
                            </section>

                            {/* Footer */}
                            <section className="mt-4 px-6 pb-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <LabeledPill label="FECHA Y HORA DE RECEPCIÓN" value={formatDate(fechaHoraRecepcion)} color={primaryColor} />
                                    <div />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {/* Quien Entrega */}
                                    <SignatureBox
                                        label="QUIEN ENTREGA"
                                        name={nombreQuienEntrega}
                                        signature={firmaQuienEntrega}
                                        color={primaryColor}
                                    />
                                    {/* Almacenista */}
                                    <SignatureBox
                                        label="ALMACENISTA"
                                        name={nombreAlmacenistaCierre}
                                        signature={firmaAlmacenista}
                                        color={primaryColor}
                                    />
                                    {/* Quien Recibe */}
                                    <SignatureBox
                                        label="QUIEN RECIBE"
                                        name={nombreQuienRecibe}
                                        signature={firmaQuienRecibe}
                                        color={primaryColor}
                                    />
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LabeledPill({ label, value, color }: { label: string; value?: string; color: string }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="inline-flex self-start rounded-full px-3 py-1 text-[9px] font-semibold tracking-wide text-white" style={{ backgroundColor: color }}>
                {label}
            </div>
            <div className="min-h-[24px] rounded-full border bg-white px-3 py-1 text-[10px] font-medium" style={{ borderColor: color, color: color }}>
                {value && value.trim().length > 0 ? value : "—"}
            </div>
        </div>
    );
}

function SignatureBox({ label, name, signature, color }: { label: string; name?: string; signature?: string | null; color: string }) {
    return (
        <div>
            <div className="rounded-t-md px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-white text-center" style={{ backgroundColor: color }}>
                {label}
            </div>
            <div className="rounded-b-md border bg-white px-2 py-2 text-[9px] flex flex-col justify-between min-h-[60px]" style={{ borderColor: color, color: color }}>
                <div className="font-medium text-center truncate">{name || "—"}</div>
                <div className="mt-1 h-[24px] border-t border-dashed border-gray-300 flex items-end justify-center">
                    {signature ? (
                        <img src={signature} alt="Firma" className="h-full object-contain" />
                    ) : (
                        <span className="text-[8px] text-gray-300">Sin firma</span>
                    )}
                </div>
            </div>
        </div>
    );
}

