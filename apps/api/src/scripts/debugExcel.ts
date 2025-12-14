import path from "node:path";
import dotenv from "dotenv";

// Load .env from apps/api directory
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
import * as XLSX from "xlsx";

const filePath = path.resolve(__dirname, "..", "..", "data", "PROGRAMA_DE_MANTENIMIENTO_PREVENTIVO.xlsx");

async function debugExcel() {
  console.log(`Reading Excel file from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);

  console.log("\n=== SHEET NAMES ===");
  console.log(workbook.SheetNames);

  // For each sheet, show structure
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n\n=== SHEET: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    
    // Get the range
    const refRange = sheet['!ref'] || 'A1:A1';
    const range = XLSX.utils.decode_range(refRange);
    console.log(`Range: ${refRange}`);
    console.log(`Rows: ${range.e.r - range.s.r + 1}, Columns: ${range.e.c - range.s.c + 1}`);

    // Show first rows to understand column structure
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 0, defval: "" });
    
    console.log("\n--- FIRST 5 ROWS (raw) ---");
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      console.log(`Row ${i}:`, JSON.stringify(row));
    }

    // Show all unique column letters that have data
    console.log("\n--- COLUMNS WITH DATA ---");
    const columnsUsed = new Set<string>();
    for (const cell in sheet) {
      if (cell[0] !== '!') {
        const col = cell.match(/^[A-Z]+/)?.[0];
        if (col) columnsUsed.add(col);
      }
    }
    console.log([...columnsUsed].sort());
  }

  console.log("\n\n=== DEBUG COMPLETE ===");
}

debugExcel();
