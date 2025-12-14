import path from "node:path";
import * as XLSX from "xlsx";

const filePath = path.resolve(__dirname, "..", "..", "data", "PROGRAMA_DE_MANTENIMIENTO_PREVENTIVO.xlsx");

function countActivities() {
  console.log(`Reading Excel file from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['MANTENIMIENTO DIARIO'];
  if (!sheet) {
    console.log("Sheet not found");
    return;
  }
  
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 0, defval: "" });

  let currentSubsistema = '';
  const bySubsistema: Record<string, any[]> = {};

  for (const row of rows) {
    if (row['A'] && String(row['A']).trim()) {
      currentSubsistema = String(row['A']).trim();
    }
    if (row['C'] && String(row['C']).trim()) {
      if (!bySubsistema[currentSubsistema]) bySubsistema[currentSubsistema] = [];
      bySubsistema[currentSubsistema]!.push({
        num: row['B'],
        actividad: String(row['C']).trim(),
        freq: row['D']
      });
    }
  }

  console.log('\n=== ACTIVIDADES POR SUBSISTEMA EN MANTENIMIENTO DIARIO ===');
  for (const [sub, acts] of Object.entries(bySubsistema)) {
    console.log(`\n${sub}: ${acts.length} actividades`);
    acts.forEach((a, i) => console.log(`  ${i+1}. [#${a.num}] ${a.actividad.substring(0, 60)}...`));
  }
}

countActivities();
