import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import { Template } from '../modules/templates/templates.types';

dotenv.config();

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'ima_templates';

let client: MongoClient;

export async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to MongoDB');
  }
  return client;
}

export async function getTemplateCollection(): Promise<Collection<Template>> {
  const client = await getClient();
  const db = client.db(dbName);
  return db.collection<Template>('templates');
}

import { WorkReport } from '../modules/workReports/workReports.types';
import { WarehouseReport } from '../modules/warehouseReports/warehouseReports.types';
import {
  WarehouseStockAdjustment,
  WarehouseStockItem,
} from '../modules/warehouse/warehouse.types';

export async function getWorkReportCollection(): Promise<Collection<WorkReport>> {
  const client = await getClient();
  const db = client.db(dbName);
  return db.collection<WorkReport>('work_reports');
}

export async function getWarehouseReportCollection(): Promise<Collection<WarehouseReport>> {
  const client = await getClient();
  const db = client.db(dbName);
  return db.collection<WarehouseReport>('warehouse_reports');
}

export async function getWarehouseStockCollection(): Promise<Collection<WarehouseStockItem>> {
  const client = await getClient();
  const db = client.db(dbName);
  return db.collection<WarehouseStockItem>('warehouse_stock');
}

export async function getWarehouseAdjustmentsCollection(): Promise<Collection<WarehouseStockAdjustment>> {
  const client = await getClient();
  const db = client.db(dbName);
  return db.collection<WarehouseStockAdjustment>('warehouse_stock_adjustments');
}
