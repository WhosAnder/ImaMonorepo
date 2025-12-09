import "dotenv/config";
import path from "node:path";
import * as XLSX from "xlsx";
import { getTemplateCollection } from "../db/mongo";
import type { Template } from "../modules/templates/templates.types";

const filePath = path.resolve(__dirname, "..", "..", "data", "PROGRAMA_DE_MANTENIMIENTO_PREVENTIVO.xlsx");

// Sheet name normalization map
const SHEET_NORMALIZATION: Record<string, string> = {
  "MANTENIMIENTO DIARIO": "DIARIO",
  "MANTENIMIENTO SEMANAL": "SEMANAL",
  "MANTENIMIENTO 1 MES": "1MES",
  "MANTENIMIENTO 3 MESES": "3MES",
  "MANTENIMIENTO 6 MESES": "6MES",
  "MANTENIMIENTO 1 AÑO": "1AÑO",
  "MANTENIMIENTO MAS DE 1AÑO": "MAS_DE_1AÑO"
};

const DEFAULT_SECCIONES = {
  actividad: { enabled: true, required: true, label: "Actividades realizadas" },
  herramientas: { enabled: true, required: false, label: "Herramientas utilizadas" },
  refacciones: { enabled: true, required: false, label: "Refacciones utilizadas" },
  observacionesGenerales: { enabled: true, required: false, label: "Observaciones generales" },
  fechas: { enabled: true, required: true, label: "Fechas y Horas" },
  firmas: { enabled: true, required: true, label: "Firmas" },
};

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    const collection = await getTemplateCollection();
    console.log("Connected.");

    // Clear existing templates
    console.log("Clearing existing templates...");
    await collection.deleteMany({});
    console.log("Templates cleared.");

    console.log(`Reading Excel file from: ${filePath}`);
    const workbook = XLSX.readFile(filePath);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // Iterate over known sheets
    for (const [sheetName, normalizedType] of Object.entries(SHEET_NORMALIZATION)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.warn(`Sheet "${sheetName}" not found, skipping.`);
        continue;
      }

      console.log(`Processing sheet: ${sheetName} -> ${normalizedType}`);

      // Read sheet with header: "A" to get raw columns A, B, C, D...
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 1 });

      let currentSubsistema = "";

      for (const row of rows) {
        // Column mapping:
        // A: Subsistema (merged/propagated)
        // B: Index (ignored)
        // C: Activity / Description / Nombre Corto
        // D: Frecuencia

        const rawSubsistema = row["A"];
        const activity = row["C"];
        const frecuencia = row["D"];

        // Propagate subsistema
        if (rawSubsistema && typeof rawSubsistema === 'string' && rawSubsistema.trim() !== "") {
          currentSubsistema = rawSubsistema.trim();
        }

        // Skip if no activity
        if (!activity || String(activity).trim() === "") {
          skipped++;
          continue;
        }

        // Skip if we haven't found a subsistema yet
        if (!currentSubsistema) {
          // console.warn("Skipping row with no subsistema context:", JSON.stringify(row));
          skipped++;
          continue;
        }

        // Map frequency code to label
        const FREQUENCY_MAP: Record<string, string> = {
          "1D": "Diario",
          "1M": "Mensual",
          "3M": "Trimestral",
          "6M": "Semestral",
          "1Y": "Anual",
          ">1Y": "Mayor a un año",
          "1W": "Semanal"
        };
        
        // Infer frequency from sheet type if column D is empty or not standard
        let rawFrecuencia = row["D"] ? String(row["D"]).trim() : "";
        
        // If raw frequency is empty or not in map, try to infer from sheet type
        if (!rawFrecuencia || !FREQUENCY_MAP[rawFrecuencia]) {
            if (normalizedType === "DIARIO") rawFrecuencia = "1D";
            else if (normalizedType === "SEMANAL") rawFrecuencia = "1W"; 
        }

        const frecuenciaCodigo = rawFrecuencia;
        const frecuenciaLabel = FREQUENCY_MAP[rawFrecuencia] || rawFrecuencia || "N/A";

        const template: Template = {
          tipoReporte: "work",
          subsistema: currentSubsistema,
          tipoMantenimiento: normalizedType,
          frecuencia: frecuenciaLabel,
          frecuenciaCodigo: frecuenciaCodigo,
          nombreCorto: String(activity).trim(),
          descripcion: String(activity).trim(),
          codigoMantenimiento: undefined, // Explicitly undefined as requested
          secciones: DEFAULT_SECCIONES,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Upsert logic
        const uniqueFilter = {
            tipoReporte: template.tipoReporte,
            subsistema: template.subsistema,
            tipoMantenimiento: template.tipoMantenimiento,
            frecuenciaCodigo: template.frecuenciaCodigo,
            nombreCorto: template.nombreCorto
        };

        const { createdAt, updatedAt, ...templateFields } = template;

        const update = {
          $set: {
            ...templateFields,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        };

        // @ts-ignore
        const result = await collection.updateOne(uniqueFilter, update, { upsert: true });

        if (result.upsertedCount > 0) inserted++;
        else if (result.matchedCount > 0) updated++;
        else skipped++;
      }
    }

    console.log(`Import finished: Inserted=${inserted}, Updated=${updated}, Skipped=${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error("Error importing templates:", error);
    process.exit(1);
  }
}

main();
