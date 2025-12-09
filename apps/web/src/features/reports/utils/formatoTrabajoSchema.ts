export const formatoTrabajoSchema = {
  id: "formato_trabajo",
  name: "Formato de trabajo",
  sections: [
    {
      id: "general",
      label: "Datos generales",
      fields: [
        { id: "subsistema", type: "select", label: "Subsistema" },
        { id: "ubicacion", type: "text", label: "Ubicación" },
        {
          id: "fechaHoraInicio",
          type: "datetime",
          label: "Fecha y hora de inicio",
        },
        { id: "turno", type: "auto-turno", label: "Turno" },
        { id: "frecuencia", type: "select", label: "Frecuencia" },
        { id: "trabajadores", type: "multi-select", label: "Trabajadores" },
      ],
    },
    {
      id: "actividad",
      label: "Actividad",
      fields: [
        {
          id: "inspeccionRealizada",
          type: "boolean",
          label: "Inspección realizada",
        },
        {
          id: "observacionesActividad",
          type: "textarea",
          label: "Observaciones",
        },
        { id: "evidencias", type: "photos", label: "Evidencias fotográficas" },
      ],
    },
    {
      id: "herramientas",
      label: "Herramientas y refacciones",
      fields: [
        {
          id: "herramientas",
          type: "multi-select",
          label: "Herramientas utilizadas",
        },
        {
          id: "refacciones",
          type: "multi-select",
          label: "Refacciones utilizadas",
        },
      ],
    },
    {
      id: "cierre",
      label: "Cierre",
      fields: [
        {
          id: "observacionesGenerales",
          type: "textarea",
          label: "Observaciones generales",
        },
        {
          id: "nombreResponsable",
          type: "text",
          label: "Nombre del responsable",
        },
        {
          id: "firmaResponsable",
          type: "signature",
          label: "Firma del responsable",
        },
        {
          id: "fechaHoraTermino",
          type: "datetime",
          label: "Fecha y hora de término",
        },
      ],
    },
  ],
} as const;
