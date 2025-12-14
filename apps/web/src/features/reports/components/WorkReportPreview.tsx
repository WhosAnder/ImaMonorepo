import React from "react";

export type ActivityPreview = {
  nombre: string;
  realizado?: boolean;
  observaciones?: string;
  evidenciasCount?: number;
};

export type WorkReportPreviewProps = {
  values: {
    subsistema?: string;
    ubicacion?: string;
    fechaHoraInicio?: string;
    turno?: string;
    frecuencia?: string;
    trabajadores?: string[];

    actividadesRealizadas?: ActivityPreview[];

    herramientas?: string[];
    refacciones?: string[];

    observacionesGenerales?: string;
    nombreResponsable?: string;
    fechaHoraTermino?: string;
    firmaResponsable?: string | null;
  };
};

export function WorkReportPreview({ values }: WorkReportPreviewProps) {
  const {
    subsistema,
    ubicacion,
    fechaHoraInicio,
    turno,
    frecuencia,
    trabajadores,
    inspeccionRealizada,
    observacionesActividad,
    evidencias,
    herramientas,
    refacciones,
    observacionesGenerales,
    nombreResponsable,
    fechaHoraTermino,
    firmaResponsable,
  } = values;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActivities = actividadesRealizadas && actividadesRealizadas.length > 0;

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 sticky top-6">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        Vista previa del reporte
      </h2>

      {/* Outer page & frame */}
      <div className="relative mx-auto w-full max-w-[750px] aspect-[8.5/11] bg-[#153A7A] p-4 text-xs leading-relaxed shadow-md overflow-hidden">
        <div className="relative h-full w-full rounded-[24px] border-[3px] border-[#F0493B] bg-[#f5f7ff] overflow-hidden flex flex-col">
          {/* Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <span className="select-none text-[90px] font-bold text-gray-400/20 rotate-[-25deg] tracking-wider">
              IMA SOLUCIONES
            </span>
          </div>

          {/* Page content */}
          <div className="relative z-10 h-full w-full flex flex-col bg-transparent">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="h-10 w-32 flex items-center justify-start">
                <img
                  src="/logo-ima.png"
                  alt="Logo IMA"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden h-10 w-28 bg-[#153A7A] text-white text-xs font-semibold rounded-md items-center justify-center">
                  LOGO IMA
                </div>
              </div>
              <div className="text-right text-[11px] leading-tight text-[#153A7A]">
                <div className="font-semibold">Formato de trabajo proyecto</div>
                <div className="uppercase text-[10px] tracking-wide">
                  AEROTREN AICM
                </div>
              </div>
            </div>
            <div className="mx-6 h-[2px] rounded-full bg-[#153A7A]" />

            <div className="flex-1 overflow-y-auto">
              {/* General data section */}
              <div className="mt-4 space-y-2 px-6">
                <div className="grid grid-cols-2 gap-4">
                  <LabeledPill label="SUBSISTEMA" value={subsistema} />
                  <LabeledPill label="FECHA Y HORA" value={formatDate(fechaHoraInicio)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <LabeledPill label="UBICACIÓN" value={ubicacion} />
                  <LabeledPill label="TURNO" value={turno} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <LabeledPill label="FRECUENCIA" value={frecuencia} />
                  <LabeledPill
                    label="TRABAJADORES INVOLUCRADOS"
                    value={trabajadores && trabajadores.length > 0 ? workersToString(trabajadores) : undefined}
                  />
                </div>
              </div>

              {/* Activities Table */}
              <section className="mt-5 px-6">
                <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white flex">
                  <span className="flex-1">ACTIVIDAD</span>
                  <span className="w-12 text-center">SI/NO</span>
                  <span className="w-24 text-center">OBSERVACIONES</span>
                  <span className="w-16 text-center">EVIDENCIAS</span>
                </div>
                <div className="rounded-b-md border border-[#153A7A] bg-white">
                  {hasActivities ? (
                    actividadesRealizadas.map((act, idx) => (
                      <div
                        key={idx}
                        className={`flex items-stretch text-[9px] text-[#153A7A] ${
                          idx > 0 ? "border-t border-[#d0d5ee]" : ""
                        }`}
                      >
                        <div className="flex-1 px-2 py-2 font-medium">{act.nombre}</div>
                        <div className="w-12 px-1 py-2 flex items-center justify-center border-l border-[#d0d5ee]">
                          <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                            act.realizado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {act.realizado ? "SÍ" : "NO"}
                          </span>
                        </div>
                        <div className="w-24 px-1 py-1 border-l border-[#d0d5ee] text-[8px] overflow-hidden">
                          {act.observaciones && act.observaciones.trim() ? (
                            <span className="line-clamp-2">{act.observaciones}</span>
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )}
                        </div>
                        <div className="w-16 px-1 py-2 flex items-center justify-center border-l border-[#d0d5ee]">
                          <span className="text-[8px]">{act.evidenciasCount ?? 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-[9px] text-gray-400 italic">
                      No hay actividades seleccionadas
                    </div>
                  )}
                </div>
              </section>

              {/* Tools and spare parts */}
              <section className="mt-5 px-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* HERRAMIENTAS */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      HERRAMIENTAS UTILIZADAS
                    </div>
                    <div className="min-h-[50px] rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A]">
                      {herramientas && herramientas.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {herramientas.map((tool) => (
                            <li key={tool}>{formatToolName(tool)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">Ninguna</span>
                      )}
                    </div>
                  </div>

                  {/* REFACCIONES */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      REFACCIONES UTILIZADAS
                    </div>
                    <div className="min-h-[50px] rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A]">
                      {refacciones && refacciones.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {refacciones.map((item) => (
                            <li key={item}>{formatPartName(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">Ninguna</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Observaciones generales */}
              <section className="mt-5 px-6">
                <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                  OBSERVACIONES GENERALES
                </div>
                <div className="min-h-[50px] rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] whitespace-pre-wrap">
                  {observacionesGenerales && observacionesGenerales.trim().length > 0
                    ? observacionesGenerales
                    : <span className="text-gray-400 italic">—</span>}
                </div>
              </section>

              {/* Footer */}
              <section className="mt-4 px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Supervisor */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      NOMBRE Y FIRMA DE SUPERVISOR
                    </div>
                    <div className="rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] flex flex-col justify-between min-h-[50px]">
                      <div className="font-medium">{nombreResponsable || "—"}</div>
                      <div className="mt-2 h-[20px] border-t border-dashed border-[#999] flex items-end justify-center">
                        {firmaResponsable && (
                          <img src={firmaResponsable} alt="Firma" className="h-5 object-contain" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* End date/time */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      FECHA Y HORA DE TÉRMINO
                    </div>
                    <div className="rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] min-h-[50px] flex items-center justify-center font-medium">
                      {fechaHoraTermino ? formatDate(fechaHoraTermino) : "—"}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledPill({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex self-start rounded-full bg-[#153A7A] px-3 py-1 text-[9px] font-semibold tracking-wide text-white">
        {label}
      </div>
      <div className="min-h-[24px] rounded-full border border-[#153A7A] bg-white px-3 py-1 text-[10px] text-[#153A7A] font-medium">
        {value && value.trim().length > 0 ? value : "—"}
      </div>
    </div>
  );
}

// Helpers
function workersToString(workers: string[]) {
  return workers
    .map((w) => w.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
    .join(", ");
}

function formatToolName(tool: string) {
  return tool.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPartName(part: string) {
  return part.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
