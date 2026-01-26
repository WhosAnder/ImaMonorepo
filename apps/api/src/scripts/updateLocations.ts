import { getWarehouseStockCollection, getClient } from "../db/mongo";

async function migrateLocations() {
    console.log("Starting location migration...");
    try {
        const collection = await getWarehouseStockCollection();
        const result = await collection.updateMany(
            {}, // filter: match all documents
            { $set: { location: "Nebrasca64" } } // update: set location
        );

        console.log(`Migration complete.`);
        console.log(`Matched ${result.matchedCount} documents.`);
        console.log(`Modified ${result.modifiedCount} documents.`);
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        const client = await getClient();
        await client.close();
        process.exit(0);
    }
}

migrateLocations();
