import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

import { getTemplateCollection } from "../db/mongo";

async function checkDB() {
  console.log("Connecting to MongoDB...");
  const collection = await getTemplateCollection();
  console.log("Connected.\n");

  // Count by subsistema and tipoMantenimiento
  const results = await collection.find({
    tipoReporte: "work",
    tipoMantenimiento: "DIARIO",
    subsistema: { $regex: /PROPULSI/i }
  }).toArray();

  console.log(`=== Templates for EQUIPO DE PROPULSIÓN + DIARIO ===`);
  console.log(`Total found: ${results.length}`);
  
  results.forEach((t, i) => {
    console.log(`${i+1}. [${t.frecuenciaCodigo}] ${t.nombreCorto?.substring(0, 60)}...`);
  });

  // Check for duplicates by nombreCorto
  const nombresCount: Record<string, number> = {};
  results.forEach(t => {
    const n = t.nombreCorto || '';
    nombresCount[n] = (nombresCount[n] || 0) + 1;
  });
  
  const dupes = Object.entries(nombresCount).filter(([_, c]) => c > 1);
  if (dupes.length > 0) {
    console.log("\n=== DUPLICATES FOUND ===");
    dupes.forEach(([name, count]) => console.log(`  "${name.substring(0,50)}..." x${count}`));
  }

  process.exit(0);
}

checkDB();
