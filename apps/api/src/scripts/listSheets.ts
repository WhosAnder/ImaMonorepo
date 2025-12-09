import "dotenv/config";
import path from "node:path";
import * as XLSX from "xlsx";

const filePath = path.resolve(__dirname, "..", "..", "data", "PROGRAMA_DE_MANTENIMIENTO_PREVENTIVO.xlsx");

function main() {
  try {
    console.log(`Reading Excel file from: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);
  } catch (error) {
    console.error("Error reading Excel file:", error);
  }
}

main();
