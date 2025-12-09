# IMA API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication & Authorization](#authentication--authorization)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Templates](#templates)
   - [Work Reports](#work-reports)
   - [Warehouse Reports](#warehouse-reports)
   - [Warehouse Stock Management](#warehouse-stock-management)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Overview

The IMA API is a RESTful API built with Hono framework for managing maintenance reports, templates, and warehouse inventory. The API uses MongoDB as the database and supports role-based access control.

**Base URL**: `http://localhost:4000` (default port, configurable via `PORT` environment variable)

**API Prefix**: `/api`

---

## Base Configuration

### Environment Variables

- `PORT`: Server port (default: 4000)
- `MONGODB_URL`: MongoDB connection string (default: `mongodb://localhost:27017`)
- `MONGODB_DB_NAME`: Database name (default: `ima_templates`)

### CORS

The API is configured to accept requests from `http://localhost:3000` with credentials enabled.

---

## Authentication & Authorization

The API uses header-based authentication and role-based authorization.

### Request Headers

- `x-user-id`: User identifier (optional)
- `x-user-name`: User name (optional)
- `x-user-role`: User role (optional, defaults to `'user'`)

### User Roles

- `admin`: Full access to all endpoints
- `warehouse_admin`: Access to warehouse management endpoints
- `user`: Standard user access (default)

### Role Guard Middleware

Some endpoints require specific roles. The `requireRole` middleware enforces this:

```typescript
requireRole(['admin', 'warehouse_admin'])
```

If a user doesn't have the required role, the API returns `403 Forbidden`.

---

## Endpoints

### Health Check

#### `GET /health`

Check API server status.

**Response** (200 OK):
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /api/ping`

Simple ping endpoint for testing.

**Response** (200 OK):
```json
{
  "message": "pong"
}
```

---

## Templates

Base path: `/api/templates`

Templates define the structure and configuration for maintenance reports.

### `GET /api/templates/filters`

Get available filter options for templates.

**Query Parameters:**
- `tipoReporte` (optional): Filter by report type (`'work'` | `'warehouse'`)
- `subsistema` (optional): Filter by subsystem

**Response** (200 OK):
```json
{
  "subsistemas": ["Subsystem 1", "Subsystem 2"],
  "frecuencias": [
    { "code": "1D", "label": "Daily" },
    { "code": "1M", "label": "Monthly" }
  ]
}
```

**Error Responses:**
- `500`: Internal server error

---

### `GET /api/templates`

List all templates with optional filters.

**Query Parameters:**
- `tipo` (optional): Alias for `tipoReporte`
- `tipoReporte` (optional): Filter by report type (`'work'` | `'warehouse'`)
- `subsistema` (optional): Filter by subsystem
- `tipoMantenimiento` (optional): Filter by maintenance type
- `frecuencia` (optional): Filter by frequency
- `frecuenciaCodigo` (optional): Filter by frequency code
- `activo` (optional): Filter by active status (`'true'` | `'false'` | `'all'`, default: `'true'`)

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "codigoMantenimiento": "MNT-001",
    "tipoReporte": "work",
    "subsistema": "Electrical",
    "tipoMantenimiento": "Preventive",
    "frecuencia": "Monthly",
    "frecuenciaCodigo": "1M",
    "nombreCorto": "Monthly Electrical Check",
    "descripcion": "Monthly preventive maintenance for electrical systems",
    "secciones": {
      "actividad": { "enabled": true, "label": "Activity", "required": true },
      "herramientas": { "enabled": true, "label": "Tools", "required": false },
      "refacciones": { "enabled": true, "label": "Parts", "required": false },
      "observacionesGenerales": { "enabled": true, "label": "General Observations", "required": false },
      "fechas": { "enabled": true, "label": "Dates", "required": true },
      "firmas": { "enabled": true, "label": "Signatures", "required": true }
    },
    "activo": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**
- `500`: Internal server error

---

### `GET /api/templates/:id`

Get a template by ID.

**Path Parameters:**
- `id`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "codigoMantenimiento": "MNT-001",
  "tipoReporte": "work",
  "subsistema": "Electrical",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Monthly",
  "frecuenciaCodigo": "1M",
  "nombreCorto": "Monthly Electrical Check",
  "descripcion": "Monthly preventive maintenance for electrical systems",
  "secciones": {
    "actividad": { "enabled": true, "label": "Activity", "required": true },
    "herramientas": { "enabled": true, "label": "Tools", "required": false },
    "refacciones": { "enabled": true, "label": "Parts", "required": false },
    "observacionesGenerales": { "enabled": true, "label": "General Observations", "required": false },
    "fechas": { "enabled": true, "label": "Dates", "required": true },
    "firmas": { "enabled": true, "label": "Signatures", "required": true }
  },
  "activo": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid ID format
- `404`: Template not found
- `500`: Internal server error

---

### `POST /api/templates`

Create a new template.

**Request Body:**
```json
{
  "codigoMantenimiento": "MNT-001",
  "tipoReporte": "work",
  "subsistema": "Electrical",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Monthly",
  "frecuenciaCodigo": "1M",
  "nombreCorto": "Monthly Electrical Check",
  "descripcion": "Monthly preventive maintenance for electrical systems",
  "secciones": {
    "actividad": { "enabled": true, "label": "Activity", "required": true },
    "herramientas": { "enabled": true, "label": "Tools", "required": false },
    "refacciones": { "enabled": true, "label": "Parts", "required": false },
    "observacionesGenerales": { "enabled": true, "label": "General Observations", "required": false },
    "fechas": { "enabled": true, "label": "Dates", "required": true },
    "firmas": { "enabled": true, "label": "Signatures", "required": true }
  },
  "activo": true
}
```

**Response** (201 Created):
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**
- `400`: Validation error (Zod schema validation failed)
- `500`: Internal server error

---

## Work Reports

Base path: `/api/reports`

Work reports document maintenance work performed.

### `GET /api/reports`

List all work reports with optional filters.

**Query Parameters:**
- `subsistema` (optional): Filter by subsystem
- `frecuencia` (optional): Filter by frequency
- `tipoMantenimiento` (optional): Filter by maintenance type

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "folio": "FT-0001",
    "subsistema": "Electrical",
    "ubicacion": "Building A - Floor 2",
    "fecha": "2024-01-01",
    "fechaHoraInicio": "2024-01-01T08:00:00.000Z",
    "fechaHoraTermino": "2024-01-01T12:00:00.000Z",
    "turno": "Morning",
    "tipoMantenimiento": "Preventive",
    "frecuencia": "Monthly",
    "templateIds": ["507f1f77bcf86cd799439012"],
    "actividadesRealizadas": [
      {
        "templateId": "507f1f77bcf86cd799439012",
        "realizado": true,
        "observaciones": "All checks completed",
        "evidencias": []
      }
    ],
    "responsable": "John Doe",
    "trabajadores": ["John Doe", "Jane Smith"],
    "inspeccionRealizada": true,
    "observacionesActividad": "Routine maintenance completed successfully",
    "evidencias": [],
    "herramientas": ["Multimeter", "Screwdriver"],
    "refacciones": ["Fuse 10A"],
    "observacionesGenerales": "No issues found",
    "firmaResponsable": "data:image/png;base64,...",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

### `GET /api/reports/:id`

Get a work report by ID.

**Path Parameters:**
- `id`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "folio": "FT-0001",
  "subsistema": "Electrical",
  "ubicacion": "Building A - Floor 2",
  "fecha": "2024-01-01",
  "fechaHoraInicio": "2024-01-01T08:00:00.000Z",
  "fechaHoraTermino": "2024-01-01T12:00:00.000Z",
  "turno": "Morning",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Monthly",
  "templateIds": ["507f1f77bcf86cd799439012"],
  "actividadesRealizadas": [
    {
      "templateId": "507f1f77bcf86cd799439012",
      "realizado": true,
      "observaciones": "All checks completed",
      "evidencias": []
    }
  ],
  "responsable": "John Doe",
  "trabajadores": ["John Doe", "Jane Smith"],
  "inspeccionRealizada": true,
  "observacionesActividad": "Routine maintenance completed successfully",
  "evidencias": [],
  "herramientas": ["Multimeter", "Screwdriver"],
  "refacciones": ["Fuse 10A"],
  "observacionesGenerales": "No issues found",
  "firmaResponsable": "data:image/png;base64,...",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid ID format
- `404`: Report not found

---

### `POST /api/reports`

Create a new work report.

**Request Body:**
```json
{
  "subsistema": "Electrical",
  "ubicacion": "Building A - Floor 2",
  "fechaHoraInicio": "2024-01-01T08:00:00.000Z",
  "fechaHoraTermino": "2024-01-01T12:00:00.000Z",
  "turno": "Morning",
  "frecuencia": "Monthly",
  "tipoMantenimiento": "Preventive",
  "templateId": "507f1f77bcf86cd799439012",
  "trabajadores": ["John Doe", "Jane Smith"],
  "inspeccionRealizada": true,
  "observacionesActividad": "Routine maintenance completed successfully",
  "evidencias": [],
  "herramientas": ["Multimeter", "Screwdriver"],
  "refacciones": ["Fuse 10A"],
  "observacionesGenerales": "No issues found",
  "nombreResponsable": "John Doe",
  "firmaResponsable": "data:image/png;base64,..."
}
```

**Response** (201 Created):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "folio": "FT-0001",
  "subsistema": "Electrical",
  "ubicacion": "Building A - Floor 2",
  "fecha": "2024-01-01",
  "fechaHoraInicio": "2024-01-01T08:00:00.000Z",
  "fechaHoraTermino": "2024-01-01T12:00:00.000Z",
  "turno": "Morning",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Monthly",
  "responsable": "John Doe",
  "trabajadores": ["John Doe", "Jane Smith"],
  "inspeccionRealizada": true,
  "observacionesActividad": "Routine maintenance completed successfully",
  "evidencias": [],
  "herramientas": ["Multimeter", "Screwdriver"],
  "refacciones": ["Fuse 10A"],
  "observacionesGenerales": "No issues found",
  "firmaResponsable": "data:image/png;base64,...",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Note:** The `folio` is automatically generated in the format `FT-XXXX` (e.g., `FT-0001`).

**Error Responses:**
- `400`: Validation error (Zod schema validation failed)
- `500`: Internal server error

---

## Warehouse Reports

Base path: `/api/warehouse-reports`

Warehouse reports document tool and part deliveries/returns and now integrate
with the warehouse stock module. Each item can reference a stock SKU, and the
API automatically generates stock adjustments for deliveries and returns while
returning a summary in the response.

### `GET /api/warehouse-reports`

List all warehouse reports with optional filters.

**Query Parameters:**
- `subsistema` (optional): Filter by subsystem
- `frecuencia` (optional): Filter by frequency
- `tipoMantenimiento` (optional): Filter by maintenance type

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "folio": "FA-0001",
    "subsistema": "Electrical",
    "fechaHoraEntrega": "2024-01-01T08:00:00.000Z",
    "fechaHoraRecepcion": "2024-01-01T16:00:00.000Z",
    "turno": "Morning",
    "tipoMantenimiento": "Preventive",
    "frecuencia": "Eventual",
    "templateId": "507f1f77bcf86cd799439012",
    "nombreQuienRecibe": "John Doe",
    "nombreAlmacenista": "Jane Smith",
    "nombreQuienEntrega": "John Doe",
    "nombreAlmacenistaCierre": "Jane Smith",
    "herramientas": [
      {
        "id": "tool-001",
        "sku": "HR-001",
        "name": "Multimeter",
        "units": 1,
        "observations": "In good condition",
        "evidencias": [
          {
            "id": "evid-001",
            "previewUrl": "https://example.com/image.jpg"
          }
        ]
      }
    ],
    "refacciones": [
      {
        "id": "part-001",
        "sku": "SP-001",
        "name": "Fuse 10A",
        "units": 2,
        "observations": "",
        "evidencias": []
      }
    ],
    "observacionesGenerales": "All items returned in good condition",
    "firmaQuienRecibe": "data:image/png;base64,...",
    "firmaAlmacenista": "data:image/png;base64,...",
    "firmaQuienEntrega": "data:image/png;base64,...",
    "createdAt": "2024-01-01T08:00:00.000Z",
    "updatedAt": "2024-01-01T16:00:00.000Z"
  }
]
```

---

### `GET /api/warehouse-reports/:id`

Get a warehouse report by ID.

**Path Parameters:**
- `id`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "folio": "FA-0001",
  "subsistema": "Electrical",
  "fechaHoraEntrega": "2024-01-01T08:00:00.000Z",
  "fechaHoraRecepcion": "2024-01-01T16:00:00.000Z",
  "turno": "Morning",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Eventual",
  "templateId": "507f1f77bcf86cd799439012",
  "nombreQuienRecibe": "John Doe",
  "nombreAlmacenista": "Jane Smith",
  "nombreQuienEntrega": "John Doe",
  "nombreAlmacenistaCierre": "Jane Smith",
  "herramientas": [
    {
      "id": "tool-001",
      "sku": "HR-001",
      "name": "Multimeter",
      "units": 1,
      "observations": "In good condition",
      "evidencias": [
        {
          "id": "evid-001",
          "previewUrl": "https://example.com/image.jpg"
        }
      ]
    }
  ],
  "refacciones": [
    {
      "id": "part-001",
      "sku": "SP-001",
      "name": "Fuse 10A",
      "units": 2,
      "observations": "",
      "evidencias": []
    }
  ],
  "observacionesGenerales": "All items returned in good condition",
  "firmaQuienRecibe": "data:image/png;base64,...",
  "firmaAlmacenista": "data:image/png;base64,...",
  "firmaQuienEntrega": "data:image/png;base64,...",
  "createdAt": "2024-01-01T08:00:00.000Z",
  "updatedAt": "2024-01-01T16:00:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid ID format
- `404`: Report not found

---

### `POST /api/warehouse-reports`

Create a new warehouse report.

**Request Body:**
```json
{
  "subsistema": "Electrical",
  "fechaHoraEntrega": "2024-01-01T08:00:00.000Z",
  "fechaHoraRecepcion": "2024-01-01T16:00:00.000Z",
  "turno": "Morning",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Eventual",
  "templateId": "507f1f77bcf86cd799439012",
  "nombreQuienRecibe": "John Doe",
  "nombreAlmacenista": "Jane Smith",
  "nombreQuienEntrega": "John Doe",
  "nombreAlmacenistaCierre": "Jane Smith",
  "herramientas": [
    {
      "id": "tool-001",
      "sku": "HR-001",
      "name": "Multimeter",
      "units": 1,
      "observations": "In good condition",
      "evidencias": [
        {
          "id": "evid-001",
          "previewUrl": "https://example.com/image.jpg"
        }
      ]
    }
  ],
  "refacciones": [
    {
      "id": "part-001",
      "sku": "SP-001",
      "name": "Fuse 10A",
      "units": 2,
      "observations": "",
      "evidencias": []
    }
  ],
  "observacionesGenerales": "All items returned in good condition",
  "firmaQuienRecibe": "data:image/png;base64,...",
  "firmaAlmacenista": "data:image/png;base64,...",
  "firmaQuienEntrega": "data:image/png;base64,..."
}
```

**Response** (201 Created):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "folio": "FA-0001",
  "subsistema": "Electrical",
  "fechaHoraEntrega": "2024-01-01T08:00:00.000Z",
  "fechaHoraRecepcion": "2024-01-01T16:00:00.000Z",
  "turno": "Morning",
  "tipoMantenimiento": "Preventive",
  "frecuencia": "Eventual",
  "templateId": "507f1f77bcf86cd799439012",
  "nombreQuienRecibe": "John Doe",
  "nombreAlmacenista": "Jane Smith",
  "nombreQuienEntrega": "John Doe",
  "nombreAlmacenistaCierre": "Jane Smith",
  "herramientas": [
    {
      "id": "tool-001",
      "sku": "HR-001",
      "name": "Multimeter",
      "units": 1,
      "observations": "In good condition",
      "evidencias": [
        {
          "id": "evid-001",
          "previewUrl": "https://example.com/image.jpg"
        }
      ]
    }
  ],
  "refacciones": [
    {
      "id": "part-001",
      "sku": "SP-001",
      "name": "Fuse 10A",
      "units": 2,
      "observations": "",
      "evidencias": []
    }
  ],
  "observacionesGenerales": "All items returned in good condition",
  "firmaQuienRecibe": "data:image/png;base64,...",
  "firmaAlmacenista": "data:image/png;base64,...",
  "firmaQuienEntrega": "data:image/png;base64,...",
  "stockAdjustments": {
    "processed": 1,
    "failed": [
      {
        "sku": "SP-001",
        "reason": "Stock item not found"
      }
    ],
    "warnings": [
      "Failed to adjust SKU SP-001: Stock item not found"
    ]
  },
  "createdAt": "2024-01-01T08:00:00.000Z",
  "updatedAt": "2024-01-01T16:00:00.000Z"
}
```

---

### `PATCH /api/warehouse-reports/:id/return`

Register the return of items listed in a warehouse report. This endpoint will
set `fechaHoraRecepcion` (if it was not provided) and automatically increase
stock for items that reference a SKU and have not been processed previously.

**Path Parameters:**
- `id`: MongoDB ObjectId of the warehouse report

**Request Body (optional):**
```json
{
  "fechaHoraRecepcion": "2024-01-02T10:00:00.000Z"
}
```
If omitted, the current timestamp is used when the return is processed for the
first time.

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "folio": "FA-0001",
  "fechaHoraEntrega": "2024-01-01T08:00:00.000Z",
  "fechaHoraRecepcion": "2024-01-02T10:00:00.000Z",
  "herramientas": [
    {
      "id": "tool-001",
      "sku": "HR-001",
      "name": "Multimeter",
      "units": 1
    }
  ],
  "stockAdjustments": {
    "processed": 1,
    "failed": [],
    "warnings": []
  },
  "returnProcessedItemIds": ["tool-001"],
  "returnAdjustedAt": "2024-01-02T10:05:00.000Z",
  "updatedAt": "2024-01-02T10:05:00.000Z"
}
```

**Error Responses:**
- `404`: Report not found
- `500`: Unable to process the return due to an internal error

**Note:** The `folio` is automatically generated in the format `FA-XXXX` (e.g., `FA-0001`).

**Error Responses:**
- `400`: Validation error (Zod schema validation failed)
- `500`: Internal server error

---

## Warehouse Stock Management

Base path: `/api/warehouse`

Manage warehouse inventory items and stock adjustments.

### `GET /api/warehouse`

List all warehouse items with optional filters.

**Query Parameters:**
- `category` (optional): Filter by category
- `location` (optional): Filter by location
- `status` (optional): Filter by status (`'active'` | `'inactive'`)
- `search` (optional): Search in name, SKU, or description
- `lowStock` (optional): Filter items below minimum quantity (`'true'` | `'false'`)

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "sku": "TOOL-001",
    "name": "Multimeter",
    "description": "Digital multimeter for electrical testing",
    "category": "Tools",
    "location": "Shelf A-1",
    "unit": "unit",
    "quantityOnHand": 5,
    "minQuantity": 2,
    "maxQuantity": 20,
    "reorderPoint": 3,
    "allowNegative": false,
    "tags": ["electrical", "testing"],
    "status": "active",
    "availableQuantity": 5,
    "isBelowMinimum": false,
    "isAboveMaximum": false,
    "needsReorder": false,
    "lastAdjustmentAt": "2024-01-01T10:00:00.000Z",
    "lastAdjustmentBy": {
      "id": "user-001",
      "name": "Jane Smith",
      "role": "warehouse_admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

### `GET /api/warehouse/:id`

Get a warehouse item by ID.

**Path Parameters:**
- `id`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "sku": "TOOL-001",
  "name": "Multimeter",
  "description": "Digital multimeter for electrical testing",
  "category": "Tools",
  "location": "Shelf A-1",
  "unit": "unit",
  "quantityOnHand": 5,
  "minQuantity": 2,
  "maxQuantity": 20,
  "reorderPoint": 3,
  "allowNegative": false,
  "tags": ["electrical", "testing"],
  "status": "active",
  "availableQuantity": 5,
  "isBelowMinimum": false,
  "isAboveMaximum": false,
  "needsReorder": false,
  "lastAdjustmentAt": "2024-01-01T10:00:00.000Z",
  "lastAdjustmentBy": {
    "id": "user-001",
    "name": "Jane Smith",
    "role": "warehouse_admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid ID format
- `404`: Item not found

---

### `POST /api/warehouse`

Create a new warehouse item.

**Required Role:** `admin` or `warehouse_admin`

**Request Body:**
```json
{
  "sku": "TOOL-001",
  "name": "Multimeter",
  "description": "Digital multimeter for electrical testing",
  "category": "Tools",
  "location": "Shelf A-1",
  "unit": "unit",
  "quantityOnHand": 5,
  "minQuantity": 2,
  "maxQuantity": 20,
  "reorderPoint": 3,
  "allowNegative": false,
  "tags": ["electrical", "testing"],
  "status": "active"
}
```

**Response** (201 Created):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "sku": "TOOL-001",
  "name": "Multimeter",
  "description": "Digital multimeter for electrical testing",
  "category": "Tools",
  "location": "Shelf A-1",
  "unit": "unit",
  "quantityOnHand": 5,
  "minQuantity": 2,
  "maxQuantity": 20,
  "reorderPoint": 3,
  "allowNegative": false,
  "tags": ["electrical", "testing"],
  "status": "active",
  "availableQuantity": 5,
  "isBelowMinimum": false,
  "isAboveMaximum": false,
  "needsReorder": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Validation error (Zod schema validation failed)
- `403`: Forbidden (insufficient permissions)
- `409`: SKU already exists
- `500`: Internal server error

---

### `PATCH /api/warehouse/:id`

Update a warehouse item (excluding quantity).

**Required Role:** `admin` or `warehouse_admin`

**Path Parameters:**
- `id`: MongoDB ObjectId

**Request Body** (all fields optional):
```json
{
  "name": "Updated Multimeter",
  "description": "Updated description",
  "category": "Tools",
  "location": "Shelf A-2",
  "unit": "unit",
  "minQuantity": 3,
  "maxQuantity": 25,
  "reorderPoint": 4,
  "allowNegative": false,
  "tags": ["electrical", "testing", "updated"],
  "status": "active"
}
```

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "sku": "TOOL-001",
  "name": "Updated Multimeter",
  "description": "Updated description",
  "category": "Tools",
  "location": "Shelf A-2",
  "unit": "unit",
  "quantityOnHand": 5,
  "minQuantity": 3,
  "maxQuantity": 25,
  "reorderPoint": 4,
  "allowNegative": false,
  "tags": ["electrical", "testing", "updated"],
  "status": "active",
  "availableQuantity": 5,
  "isBelowMinimum": false,
  "isAboveMaximum": false,
  "needsReorder": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- `400`: Validation error (Zod schema validation failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Item not found
- `500`: Internal server error

---

### `GET /api/warehouse/:id/adjustments`

Get stock adjustment history for an item.

**Path Parameters:**
- `id`: MongoDB ObjectId

**Query Parameters:**
- `limit` (optional): Maximum number of adjustments to return (default: 50)

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "itemId": "507f1f77bcf86cd799439011",
    "delta": 5,
    "reason": "increase",
    "note": "New stock received",
    "actorId": "user-001",
    "actorName": "Jane Smith",
    "actorRole": "warehouse_admin",
    "resultingQuantity": 10,
    "createdAt": "2024-01-01T10:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "itemId": "507f1f77bcf86cd799439011",
    "delta": -2,
    "reason": "decrease",
    "note": "Used for maintenance",
    "actorId": "user-002",
    "actorName": "John Doe",
    "actorRole": "warehouse_admin",
    "resultingQuantity": 8,
    "createdAt": "2024-01-01T11:00:00.000Z"
  }
]
```

**Error Responses:**
- `400`: Invalid ID format

---

### `POST /api/warehouse/:id/adjustments`

Adjust stock quantity for an item.

**Required Role:** `admin` or `warehouse_admin`

**Path Parameters:**
- `id`: MongoDB ObjectId

**Request Body:**
```json
{
  "delta": -2,
  "reason": "decrease",
  "note": "Used for maintenance work"
}
```

**Valid `reason` values:**
- `"initial"`: Initial stock entry
- `"increase"`: Stock increase
- `"decrease"`: Stock decrease
- `"correction"`: Correction of previous error
- `"damage"`: Item damaged/lost
- `"audit"`: Audit adjustment

**Response** (200 OK):
```json
{
  "item": {
    "_id": "507f1f77bcf86cd799439011",
    "sku": "TOOL-001",
    "name": "Multimeter",
    "description": "Digital multimeter for electrical testing",
    "category": "Tools",
    "location": "Shelf A-1",
    "unit": "unit",
    "quantityOnHand": 3,
    "minQuantity": 2,
    "maxQuantity": 20,
    "reorderPoint": 3,
    "allowNegative": false,
    "tags": ["electrical", "testing"],
    "status": "active",
    "availableQuantity": 3,
    "isBelowMinimum": false,
    "isAboveMaximum": false,
    "needsReorder": true,
    "lastAdjustmentAt": "2024-01-01T12:00:00.000Z",
    "lastAdjustmentBy": {
      "id": "user-001",
      "name": "Jane Smith",
      "role": "warehouse_admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "adjustment": {
    "_id": "507f1f77bcf86cd799439014",
    "itemId": "507f1f77bcf86cd799439011",
    "delta": -2,
    "reason": "decrease",
    "note": "Used for maintenance work",
    "actorId": "user-001",
    "actorName": "Jane Smith",
    "actorRole": "warehouse_admin",
    "resultingQuantity": 3,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Validation error (Zod schema validation failed)
  - `delta` must not be zero
  - Quantity cannot go below zero (if `allowNegative` is false)
- `403`: Forbidden (insufficient permissions)
- `404`: Item not found
- `500`: Internal server error

---

## Data Models

### Template

```typescript
interface Template {
  _id?: ObjectId;
  codigoMantenimiento?: string | null;
  tipoReporte: 'work' | 'warehouse';
  subsistema: string;
  tipoMantenimiento: string;
  frecuencia: string;
  frecuenciaCodigo: string;
  nombreCorto: string;
  descripcion?: string;
  secciones: {
    actividad: TemplateSectionConfig;
    herramientas: TemplateSectionConfig;
    refacciones: TemplateSectionConfig;
    observacionesGenerales: TemplateSectionConfig;
    fechas: TemplateSectionConfig;
    firmas: TemplateSectionConfig;
  };
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TemplateSectionConfig {
  enabled: boolean;
  label?: string;
  required?: boolean;
}
```

### Work Report

```typescript
interface WorkReport {
  _id?: ObjectId;
  folio: string; // Auto-generated: FT-XXXX
  subsistema: string;
  ubicacion: string;
  fecha: string; // YYYY-MM-DD
  fechaHoraInicio: string; // ISO 8601
  fechaHoraTermino: string; // ISO 8601
  turno: string;
  tipoMantenimiento: string;
  frecuencia: string;
  templateIds?: string[];
  actividadesRealizadas?: ActivityDetail[];
  responsable: string;
  trabajadores: string[];
  inspeccionRealizada?: boolean;
  observacionesActividad?: string;
  evidencias?: any[];
  herramientas: string[] | ReportToolOrPart[];
  refacciones: string[] | ReportToolOrPart[];
  observacionesGenerales?: string;
  firmaResponsable?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityDetail {
  templateId: string;
  realizado: boolean;
  observaciones?: string;
  evidencias?: any[];
}

interface ReportToolOrPart {
  nombre: string;
  unidad: string;
  cantidad?: number;
  observaciones?: string;
  fotoUrls?: string[];
}
```

### Warehouse Report

```typescript
interface WarehouseReport {
  _id?: ObjectId;
  folio: string; // Auto-generated: FA-XXXX
  subsistema: string;
  fechaHoraEntrega: string; // ISO 8601
  fechaHoraRecepcion?: string; // ISO 8601
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

interface WarehouseItem {
  id: string;
  sku?: string;
  name: string;
  units: number;
  observations: string;
  evidencias: {
    id: string;
    previewUrl: string;
  }[];
}

interface StockAdjustmentSummary {
  processed: number;
  failed: { sku: string; reason: string }[];
  warnings: string[];
}
```

### Warehouse Stock Item

```typescript
interface WarehouseStockItem {
  _id?: ObjectId;
  sku: string; // Unique
  name: string;
  description?: string;
  category?: string;
  location?: string;
  unit?: string;
  quantityOnHand: number;
  minQuantity?: number;
  maxQuantity?: number;
  reorderPoint?: number;
  allowNegative?: boolean;
  tags?: string[];
  status: 'active' | 'inactive';
  lastAdjustmentAt?: Date;
  lastAdjustmentBy?: {
    id?: string;
    name?: string;
    role?: UserRole;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface WarehouseStockAdjustment {
  _id?: ObjectId;
  itemId: ObjectId;
  delta: number; // Can be positive or negative
  reason: 'initial' | 'increase' | 'decrease' | 'correction' | 'damage' | 'audit';
  note?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  resultingQuantity: number;
  createdAt: Date;
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error responses in JSON format.

### Error Response Format

```json
{
  "error": "Error message",
  "details": [] // Optional, for validation errors
}
```

### Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request (validation error, invalid ID format, etc.)
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate SKU)
- `500 Internal Server Error`: Server error

### Validation Errors

When Zod schema validation fails, the API returns:

```json
{
  "error": "Validation Error",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Validation error message",
      "code": "invalid_type"
    }
  ]
}
```

---

## Examples

### Example: Create a Work Report

```bash
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-001" \
  -H "x-user-name: John Doe" \
  -H "x-user-role: user" \
  -d '{
    "subsistema": "Electrical",
    "ubicacion": "Building A - Floor 2",
    "fechaHoraInicio": "2024-01-01T08:00:00.000Z",
    "turno": "Morning",
    "frecuencia": "Monthly",
    "tipoMantenimiento": "Preventive",
    "trabajadores": ["John Doe", "Jane Smith"],
    "inspeccionRealizada": true,
    "observacionesActividad": "Routine maintenance completed",
    "herramientas": ["Multimeter", "Screwdriver"],
    "refacciones": ["Fuse 10A"],
    "nombreResponsable": "John Doe"
  }'
```

### Example: List Warehouse Items with Filters

```bash
curl "http://localhost:4000/api/warehouse?status=active&lowStock=true&search=multimeter"
```

### Example: Adjust Warehouse Stock

```bash
curl -X POST http://localhost:4000/api/warehouse/507f1f77bcf86cd799439011/adjustments \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-001" \
  -H "x-user-name: Jane Smith" \
  -H "x-user-role: warehouse_admin" \
  -d '{
    "delta": -2,
    "reason": "decrease",
    "note": "Used for maintenance work"
  }'
```

### Example: Get Template Filters

```bash
curl "http://localhost:4000/api/templates/filters?tipoReporte=work&subsistema=Electrical"
```

---

## Notes

1. **Folio Generation**: Work reports and warehouse reports automatically generate folios:
   - Work reports: `FT-XXXX` (e.g., `FT-0001`)
   - Warehouse reports: `FA-XXXX` (e.g., `FA-0001`)

2. **Stock Adjustments**: Stock adjustments are atomic operations that:
   - Update the item's `quantityOnHand`
   - Create an adjustment record
   - Prevent negative quantities (unless `allowNegative` is true)
   - Track the actor who made the adjustment

3. **Date Formats**: 
   - ISO 8601 strings for date-time fields
   - `YYYY-MM-DD` format for date-only fields

4. **MongoDB ObjectIds**: All `_id` fields are MongoDB ObjectIds, represented as strings in JSON responses.

5. **Computed Fields**: Warehouse items include computed fields:
   - `availableQuantity`: Same as `quantityOnHand`
   - `isBelowMinimum`: `true` if quantity < `minQuantity`
   - `isAboveMaximum`: `true` if quantity > `maxQuantity`
   - `needsReorder`: `true` if quantity <= `reorderPoint`

---

## Version

This documentation is for API version 1.0.0.
