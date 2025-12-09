import { ObjectId } from 'mongodb';

export interface WarehouseItem {
  id: string;
  sku?: string;
  name: string;
  units: number;
  observations: string;
  evidences: {
    id: string;
    previewUrl: string;
  }[];
}

export interface WarehouseReport {
  _id?: ObjectId;
  folio: string;
  subsistema: string;
  fechaHoraEntrega: string;
  fechaHoraRecepcion?: string;
  turno: string;
  tipoMantenimiento: string;
  frecuencia: string;
  templateId?: string;
  nombreQuienRecibe: string;
  nombreAlmacenista: string;
  nombreQuienEntrega: string;
  nombreAlmacenistaCierre: string;
  herramientas: WarehouseItem[];
  refacciones: WarehouseItem[];
  observacionesGenerales?: string;
  firmaQuienRecibe?: string;
  firmaAlmacenista?: string;
  firmaQuienEntrega?: string;
  deliveryAdjustedAt?: Date;
  returnProcessedItemIds?: string[];
  returnAdjustedAt?: Date;
  stockAdjustments?: StockAdjustmentSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAdjustmentSummary {
  processed: number;
  failed: Array<{ sku: string; reason: string }>;
  warnings: string[];
}

export type WarehouseReportWithAdjustments = WarehouseReport & {
  stockAdjustments?: StockAdjustmentSummary;
};
