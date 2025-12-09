export type WarehouseItem = {
    id: string;
    sku?: string;
    name: string;
    units: number;
    observations: string;
    evidences: {
        id: string;
        previewUrl: string;
    }[];
};

export type WarehouseReport = {
    subsistema: string;
    fechaHoraEntrega: string;
    turno: string;

    nombreQuienRecibe: string;
    nombreAlmacenista: string;

    herramientas: WarehouseItem[];
    refacciones: WarehouseItem[];

    observacionesGenerales: string;

    fechaHoraRecepcion?: string;
    nombreQuienEntrega: string;
    nombreAlmacenistaCierre: string; // can be same as nombreAlmacenista for now

    firmaQuienRecibe?: string;       // dataURL from SignaturePad (optional for now)
    firmaAlmacenista?: string;
    firmaQuienEntrega?: string;
};
