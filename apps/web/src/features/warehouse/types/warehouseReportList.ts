export type WarehouseReportListItem = {
  id: string;
  folio: string;
  subsistema: string;
  fechaEntrega: string; // formatted date string
  turno: string;
  responsableAlmacen: string;
  responsableRecepcion: string;
};
