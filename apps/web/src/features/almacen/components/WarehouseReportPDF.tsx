import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { WarehouseReportFormValues } from "../schemas/warehouseReportSchema";
import { themes } from "@/shared/theme/colors";

// Helper types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T[P] extends object
  ? DeepPartial<T[P]>
  : T[P];
};

export type WarehouseReportPDFProps = {
  values: DeepPartial<WarehouseReportFormValues>;
};

const primaryColor = themes.warehouse.primary;

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
    fontSize: 70,
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
  // Pill styles
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
  // Tables/Lists
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
  itemRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 4,
    marginBottom: 4,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 9,
    color: "#1f2937", // gray-800
    fontWeight: "bold",
    maxWidth: "80%",
  },
  itemUnits: {
    fontSize: 9,
    color: "#1f2937",
    fontWeight: "bold",
  },
  itemObs: {
    fontSize: 8,
    color: "#6b7280", // gray-500
  },
  itemEvidences: {
    fontSize: 8,
    color: "#9ca3af", // gray-400
  },
  emptyText: {
    fontSize: 9,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 5,
  },
  // Helper function for date formatting
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

const LabeledPill = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.col}>
    <Text style={styles.pillLabel}>{label}</Text>
    <Text style={styles.pillValue}>
      {value && value.trim().length > 0 ? value : "—"}
    </Text>
  </View>
);

const SignatureBox = ({
  label,
  name,
  signature,
}: {
  label: string;
  name?: string;
  signature?: string | null;
}) => (
  <View style={styles.col}>
    <Text style={[styles.sectionHeader, { textAlign: "center" }]}>{label}</Text>
    <View
      style={[
        styles.sectionContent,
        { minHeight: 60, justifyContent: "space-between" },
      ]}
    >
      <Text
        style={{
          fontSize: 8,
          textAlign: "center",
          color: primaryColor,
          overflow: "hidden",
          maxLines: 1,
        }}
      >
        {name || "—"}
      </Text>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#d1d5db",
          borderStyle: "dashed",
          height: 30,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {signature ? (
          <Image src={signature} style={{ height: 28, objectFit: "contain" }} />
        ) : (
          <Text style={{ fontSize: 7, color: "#d1d5db" }}>Sin firma</Text>
        )}
      </View>
    </View>
  </View>
);

export const WarehouseReportPDF = ({ values }: WarehouseReportPDFProps) => {
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
    firmaQuienRecibe,
    firmaAlmacenista,
    firmaQuienEntrega,
    cliente,
  } = values;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.container}>
          {/* Watermark simulated */}
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>ALMACÉN IMA</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Image src="/logo-ima.png" style={styles.headerLogo} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Formato de almacén proyecto
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
                label="FECHA Y HORA DE ENTREGA"
                value={formatDate(fechaHoraEntrega)}
              />
            </View>
            <View style={styles.row}>
              <LabeledPill label="TURNO" value={turno} />
              <LabeledPill
                label="NOMBRE ALMACENISTA"
                value={nombreAlmacenista}
              />
            </View>
            <View style={styles.row}>
              <LabeledPill
                label="NOMBRE QUIEN RECIBE"
                value={nombreQuienRecibe}
              />
              <View style={styles.col} />
            </View>
          </View>

          {/* Herramientas */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              HERRAMIENTAS QUE SE ENTREGAN
            </Text>
            <View style={styles.sectionContent}>
              {herramientas && herramientas.length > 0 ? (
                toolsOrPartsList(herramientas)
              ) : (
                <Text style={styles.emptyText}>
                  Sin herramientas registradas
                </Text>
              )}
            </View>
          </View>

          {/* Refacciones */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              REFACCIONES QUE SE ENTREGAN
            </Text>
            <View style={styles.sectionContent}>
              {refacciones && refacciones.length > 0 ? (
                toolsOrPartsList(refacciones)
              ) : (
                <Text style={styles.emptyText}>
                  Sin refacciones registradas
                </Text>
              )}
            </View>
          </View>

          {/* Observaciones */}
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

          {/* Footer / Signatures */}
          <View
            style={[styles.section, { marginTop: "auto", marginBottom: 20 }]}
          >
            <View style={[styles.row, { marginBottom: 15 }]}>
              <LabeledPill
                label="FECHA Y HORA DE RECEPCIÓN"
                value={formatDate(fechaHoraRecepcion)}
              />
              <View style={styles.col} />
            </View>
            <View style={styles.row}>
              <SignatureBox
                label="QUIEN ENTREGA"
                name={nombreQuienEntrega}
                signature={firmaQuienEntrega}
              />
              <SignatureBox
                label="ALMACENISTA"
                name={nombreAlmacenista}
                signature={firmaAlmacenista}
              />
              <SignatureBox
                label="QUIEN RECIBE"
                name={nombreQuienRecibe}
                signature={firmaQuienRecibe}
              />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const toolsOrPartsList = (items: any[]) =>
  items.map((item, idx) => (
    <View key={item.id || idx} style={styles.itemRow}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnits}>{item.units} un.</Text>
      </View>
      <Text style={styles.itemObs}>
        {item.observations || "Sin observaciones"}
      </Text>
      <Text style={styles.itemEvidences}>
        Evidencias: {item.evidences?.length || 0} / 5 fotos
      </Text>
    </View>
  ));
