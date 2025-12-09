import "dotenv/config";
import { getTemplateCollection } from "../db/mongo";

async function main() {
  try {
    const collection = await getTemplateCollection();
    const templates = await collection.find({}).limit(10).toArray();
    
    console.log("Sample Templates:");
    templates.forEach(t => {
      console.log(`ID: ${t._id}, Sub: ${t.subsistema}, FrecCode: "${t.frecuenciaCodigo}", FrecLabel: "${t.frecuencia}"`);
    });

    // Check unique frequency codes
    const allTemplates = await collection.find({}).toArray();
    const codes = new Set(allTemplates.map(t => t.frecuenciaCodigo));
    console.log("\nUnique Frequency Codes:", Array.from(codes));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
