import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

export type ActivityPDFItem = {
  nombre: string;
  realizado?: boolean;
  observaciones?: string;
  evidenciasCount?: number;
};

export type WorkReportPDFProps = {
  values: {
    subsistema?: string;
    cliente?: string;
    ubicacion?: string;
    fechaHoraInicio?: string;
    turno?: string;
    frecuencia?: string;
    trabajadores?: string[];
    actividadesRealizadas?: ActivityPDFItem[];
    herramientas?: string[];
    refacciones?: string[];
    observacionesGenerales?: string;
    nombreResponsable?: string;
    fechaHoraTermino?: string;
    firmaResponsable?: string | null;
    folio?: string;
  };
};

const primaryColor = "#153A7A";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#f5f7ff",
    padding: 0,
    fontFamily: "Helvetica",
  },
  container: {
    backgroundColor: "#f5f7ff",
    height: "100%",
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  watermarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.1,
    zIndex: -1,
  },
  watermarkText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#9ca3af",
    transform: "rotate(-25deg)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerLogo: {
    width: 100,
    height: 40,
    objectFit: "contain",
  },
  headerTextContainer: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 10,
    color: primaryColor,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 9,
    color: primaryColor,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  divider: {
    height: 2,
    backgroundColor: primaryColor,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  pillLabel: {
    backgroundColor: primaryColor,
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  pillValue: {
    borderWidth: 1,
    borderColor: primaryColor,
    color: primaryColor,
    backgroundColor: "white",
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minHeight: 20,
  },
  sectionHeader: {
    backgroundColor: primaryColor,
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    textTransform: "uppercase",
  },
  sectionContent: {
    borderWidth: 1,
    borderColor: primaryColor,
    backgroundColor: "white",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    padding: 5,
    minHeight: 20,
  },
  listItem: {
    fontSize: 9,
    color: primaryColor,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 9,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  // Activity table styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: primaryColor,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    color: "white",
    fontSize: 7,
    fontWeight: "bold",
    paddingVertical: 4,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d0d5ee",
    backgroundColor: "white",
  },
  tableCell: {
    fontSize: 8,
    color: primaryColor,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#d0d5ee",
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
});

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

const formatName = (name: string) => {
  return name
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatFrecuencia = (code?: string) => {
  if (!code) return "—";
  const map: Record<string, string> = {
    "1D": "Diario",
    "1W": "Semanal",
    "1M": "Mensual",
    "3M": "Trimestral (3 meses)",
    "6M": "Semestral (6 meses)",
    "1A": "Anual (1 año)",
    "2A": "2 años",
    "3A": "3 años",
    "4A": "4 años",
    "5A": "5 años",
    "6A": "6 años",
  };
  return map[code] || code;
};

const LabeledPill = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.col}>
    <Text style={styles.pillLabel}>{label}</Text>
    <Text style={styles.pillValue}>
      {value && value.trim().length > 0 ? value : "—"}
    </Text>
  </View>
);

export const WorkReportPDF = ({ values }: WorkReportPDFProps) => {
  const {
    subsistema,
    ubicacion,
    fechaHoraInicio,
    turno,
    frecuencia,
    trabajadores,
    actividadesRealizadas,
    herramientas,
    refacciones,
    observacionesGenerales,
    nombreResponsable,
    fechaHoraTermino,
    firmaResponsable,
    cliente,
  } = values;

  const workersString = trabajadores?.map(formatName).join(", ") || "—";
  const hasActivities =
    actividadesRealizadas && actividadesRealizadas.length > 0;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.container}>
          {/* Watermark */}
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>IMA SOLUCIONES</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Image src="/logo-ima.png" style={styles.headerLogo} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Formato de trabajo proyecto
              </Text>
              <Text style={styles.headerSubtitle}>
                {values.cliente || "AEROTREN AICM"}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* General Data */}
          <View style={styles.section}>
            <View style={styles.row}>
              <LabeledPill label="SUBSISTEMA" value={subsistema} />
              <LabeledPill
                label="FECHA Y HORA"
                value={formatDate(fechaHoraInicio)}
              />
            </View>
            <View style={styles.row}>
              <LabeledPill label="UBICACIÓN" value={ubicacion} />
              <LabeledPill label="TURNO" value={turno} />
            </View>
            <View style={styles.row}>
              <LabeledPill label="FRECUENCIA" value={formatFrecuencia(frecuencia)} />
              <LabeledPill
                label="TRABAJADORES INVOLUCRADOS"
                value={workersString}
              />
            </View>
          </View>

          {/* Activities Table */}
          <View style={styles.section}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
                ACTIVIDAD
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: 40, textAlign: "center" },
                ]}
              >
                SI/NO
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { flex: 1, textAlign: "center" },
                ]}
              >
                OBSERVACIONES
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: 50, textAlign: "center" },
                ]}
              >
                EVIDENCIAS
              </Text>
            </View>
            {/* Table Body */}
            <View
              style={{
                borderWidth: 1,
                borderTopWidth: 0,
                borderColor: primaryColor,
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 6,
                overflow: "hidden",
              }}
            >
              {hasActivities ? (
                actividadesRealizadas.map((act, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx === actividadesRealizadas.length - 1
                        ? { borderBottomWidth: 0 }
                        : {},
                    ]}
                  >
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <Text>{act.nombre}</Text>
                    </View>
                    <View
                      style={[
                        styles.tableCell,
                        {
                          width: 40,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          fontWeight: "bold",
                          color: act.realizado ? "#15803d" : "#6b7280",
                        }}
                      >
                        {act.realizado ? "SÍ" : "NO"}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <Text style={{ fontSize: 7 }}>
                        {act.observaciones && act.observaciones.trim()
                          ? act.observaciones
                          : "—"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.tableCell,
                        styles.tableCellLast,
                        {
                          width: 50,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 7 }}>
                        {act.evidenciasCount ?? 0}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ padding: 10 }}>
                  <Text style={styles.emptyText}>
                    No hay actividades registradas
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tools and Parts */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.sectionHeader}>
                  HERRAMIENTAS UTILIZADAS
                </Text>
                <View style={[styles.sectionContent, { minHeight: 40 }]}>
                  {herramientas && herramientas.length > 0 ? (
                    herramientas.map((tool, idx) => (
                      <Text key={idx} style={styles.listItem}>
                        • {formatName(tool)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Ninguna</Text>
                  )}
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.sectionHeader}>REFACCIONES UTILIZADAS</Text>
                <View style={[styles.sectionContent, { minHeight: 40 }]}>
                  {refacciones && refacciones.length > 0 ? (
                    refacciones.map((part, idx) => (
                      <Text key={idx} style={styles.listItem}>
                        • {formatName(part)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Ninguna</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* General Observations */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>OBSERVACIONES GENERALES</Text>
            <View style={[styles.sectionContent, { minHeight: 40 }]}>
              <Text style={{ fontSize: 9, color: primaryColor }}>
                {observacionesGenerales &&
                  observacionesGenerales.trim().length > 0
                  ? observacionesGenerales
                  : "—"}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View
            style={[styles.section, { marginTop: "auto", marginBottom: 20 }]}
          >
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.sectionHeader, { textAlign: "center" }]}>
                  NOMBRE Y FIRMA DE SUPERVISOR
                </Text>
                <View
                  style={[
                    styles.sectionContent,
                    { minHeight: 50, justifyContent: "space-between" },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      color: primaryColor,
                    }}
                  >
                    {nombreResponsable || "—"}
                  </Text>
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "#999",
                      borderStyle: "dashed",
                      height: 25,
                      justifyContent: "flex-end",
                      alignItems: "center",
                      marginTop: 5,
                    }}
                  >
                    {firmaResponsable ? (
                      <Image
                        src={firmaResponsable}
                        style={{ height: 22, objectFit: "contain" }}
                      />
                    ) : (
                      <Text style={{ fontSize: 7, color: "#d1d5db" }}>
                        Sin firma
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.col}>
                <Text style={[styles.sectionHeader, { textAlign: "center" }]}>
                  FECHA Y HORA DE TÉRMINO
                </Text>
                <View
                  style={[
                    styles.sectionContent,
                    {
                      minHeight: 50,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "bold",
                      color: primaryColor,
                    }}
                  >
                    {fechaHoraTermino ? formatDate(fechaHoraTermino) : "—"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
