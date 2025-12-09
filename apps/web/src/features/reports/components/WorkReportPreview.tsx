import React from "react";

export type WorkReportPreviewProps = {
  values: {
    subsistema?: string;
    ubicacion?: string;
    fechaHoraInicio?: string;
    turno?: string;
    frecuencia?: string;
    trabajadores?: string[];

    inspeccionRealizada?: boolean;
    observacionesActividad?: string;
    evidenciasCount?: number;

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
    evidenciasCount,
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

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 sticky top-6">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        Vista previa del reporte
      </h2>

      {/* 1. Outer page & frame */}
      <div className="relative mx-auto w-full max-w-[750px] aspect-[8.5/11] bg-[#153A7A] p-4 text-xs leading-relaxed shadow-md overflow-hidden">
        <div className="relative h-full w-full rounded-[24px] border-[3px] border-[#F0493B] bg-[#f5f7ff] overflow-hidden flex flex-col">
          {/* 2. Watermark - Visible behind content */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <span className="select-none text-[90px] font-bold text-gray-400/20 rotate-[-25deg] tracking-wider">
              IMA SOLUCIONES
            </span>
          </div>

          {/* Page content - Transparent wrapper */}
          <div className="relative z-10 h-full w-full flex flex-col bg-transparent">
            {/* 3. Header layout */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="h-10 w-32 flex items-center justify-start">
                <img
                  src="/logo-ima.png"
                  alt="Logo IMA"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <div className="hidden h-10 w-28 bg-[#153A7A] text-white text-xs font-semibold rounded-md flex items-center justify-center">
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
              {/* 3. General data section */}
              <div className="mt-4 space-y-2 px-6">
                <div className="grid grid-cols-2 gap-4">
                  <LabeledPill label="SUBSISTEMA" value={subsistema} />
                  <LabeledPill
                    label="FECHA Y HORA"
                    value={formatDate(fechaHoraInicio)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <LabeledPill label="UBICACIÓN" value={ubicacion} />
                  <LabeledPill label="TURNO" value={turno} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <LabeledPill label="FRECUENCIA" value={frecuencia} />
                  <LabeledPill
                    label="TRABAJADORES INVOLUCRADOS"
                    value={
                      trabajadores && trabajadores.length > 0
                        ? workersToString(trabajadores)
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* 4. Activity section */}
              <section className="mt-5 px-6">
                <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                  ACTIVIDAD
                </div>
                <div className="rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      ¿Inspección realizada?
                    </span>
                    <span className="font-semibold">
                      {inspeccionRealizada ? "SÍ" : "NO"}
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="text-[9px] font-semibold uppercase text-[#777]">
                      OBSERVACIONES
                    </div>
                    <div className="min-h-[40px] rounded border border-[#d0d5ee] bg-white px-2 py-1 whitespace-pre-wrap">
                      {observacionesActividad &&
                      observacionesActividad.trim().length > 0
                        ? observacionesActividad
                        : "—"}
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-[#555]">
                    <span>Evidencias adjuntas:</span>
                    <span>{evidenciasCount ?? 0} / 5</span>
                  </div>
                </div>
              </section>

              {/* 5. Tools and spare parts sections */}
              <section className="mt-5 px-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* HERRAMIENTAS */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      HERRAMIENTAS UTILIZADAS
                    </div>
                    <div className="min-h-[70px] rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A]">
                      {herramientas && herramientas.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {herramientas.map((tool) => (
                            <li key={tool}>{formatToolName(tool)}</li>
                          ))}
                        </ul>
                      ) : (
                        "Ninguna"
                      )}
                    </div>
                  </div>

                  {/* REFACCIONES */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      REFACCIONES UTILIZADAS
                    </div>
                    <div className="min-h-[70px] rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A]">
                      {refacciones && refacciones.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {refacciones.map((item) => (
                            <li key={item}>{formatPartName(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        "Ninguna"
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. Observaciones generales */}
              <section className="mt-5 px-6">
                <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                  OBSERVACIONES GENERALES
                </div>
                <div className="min-h-[80px] rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] whitespace-pre-wrap">
                  {observacionesGenerales &&
                  observacionesGenerales.trim().length > 0
                    ? observacionesGenerales
                    : "—"}
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
                    <div className="rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] flex flex-col justify-between min-h-[60px]">
                      <div className="font-medium">
                        {nombreResponsable || "—"}
                      </div>
                      <div className="mt-2 h-[24px] border-t border-dashed border-[#999] flex items-end justify-center">
                        {/* optional tiny signature preview */}
                        {firmaResponsable && (
                          <img
                            src={firmaResponsable}
                            alt="Firma"
                            className="h-6 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* End date/time */}
                  <div>
                    <div className="rounded-t-md bg-[#153A7A] px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                      FECHA Y HORA DE TÉRMINO
                    </div>
                    <div className="rounded-b-md border border-[#153A7A] bg-white px-3 py-2 text-[10px] text-[#153A7A] min-h-[60px] flex items-center justify-center font-medium">
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

// Helpers for formatting mock values
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
