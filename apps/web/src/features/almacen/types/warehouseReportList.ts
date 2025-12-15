export type WarehouseReportListItem = {
  id: string;
  folio: string;
  subsistema: string;
  fechaEntrega: string; // formatted date string
  responsableAlmacen: string;
  responsableRecepcion: string;
};
