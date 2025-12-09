"use client";

import React, { useState } from "react";
import { AppLayout } from "@/shared/layout/AppLayout";
import { RequireRole } from "@/features/auth/components/RequireRole";
import { Button } from "@/shared/ui/Button";
import {
  useWarehouseItems,
  useCreateWarehouseItem,
  useAdjustWarehouseStock,
} from "@/hooks/useWarehouse";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  X,
  Filter,
} from "lucide-react";

export default function InventarioPage() {
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { data: items, isLoading, error } = useWarehouseItems({
    search: search || undefined,
    lowStock: showLowStock || undefined,
  });

  const createMutation = useCreateWarehouseItem();
  const adjustMutation = useAdjustWarehouseStock();

  // Form state for create modal
  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    location: "",
    unit: "pza",
    quantityOnHand: 0,
    minQuantity: 0,
  });

  // Form state for adjust modal
  const [adjustment, setAdjustment] = useState({
    delta: 0,
    reason: "increase" as "increase" | "decrease" | "correction" | "damage",
    note: "",
  });

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(newItem);
      setIsCreateModalOpen(false);
      setNewItem({
        sku: "",
        name: "",
        description: "",
        category: "",
        location: "",
        unit: "pza",
        quantityOnHand: 0,
        minQuantity: 0,
      });
    } catch (err) {
      alert("Error al crear item");
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    try {
      await adjustMutation.mutateAsync({
        id: selectedItemId,
        adjustment,
      });
      setIsAdjustModalOpen(false);
      setSelectedItemId(null);
      setAdjustment({ delta: 0, reason: "increase", note: "" });
    } catch (err) {
      alert("Error al ajustar stock");
    }
  };

  const openAdjustModal = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsAdjustModalOpen(true);
  };

  return (
    <RequireRole allowedRoles={["admin", "warehouse"]}>
      <AppLayout title="Inventario">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
              <p className="text-gray-500">
                Gestiona herramientas y refacciones del almacén
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por SKU, nombre o descripción..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showLowStock
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Stock bajo
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Cargando inventario...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                Error al cargar inventario
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-center font-medium text-gray-700">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No hay items en el inventario
                      </td>
                    </tr>
                  ) : (
                    items?.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {item.name}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {item.category || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {item.location || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                              item.isBelowMinimum
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.quantityOnHand} {item.unit || "pza"}
                          </span>
                          {item.isBelowMinimum && (
                            <div className="text-xs text-red-500 mt-1">
                              Mín: {item.minQuantity}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openAdjustModal(item._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Ajustar stock"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Item Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Nuevo Item
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      required
                      value={newItem.sku}
                      onChange={(e) =>
                        setNewItem({ ...newItem, sku: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="herramientas">Herramientas</option>
                      <option value="refacciones">Refacciones</option>
                      <option value="consumibles">Consumibles</option>
                      <option value="equipo">Equipo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={newItem.location}
                      onChange={(e) =>
                        setNewItem({ ...newItem, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="Ej: Estante A-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newItem.quantityOnHand}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantityOnHand: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newItem.minQuantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          minQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad
                    </label>
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unit: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={createMutation.isPending}>
                    Crear
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {isAdjustModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Ajustar Stock
                </h3>
                <button
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de ajuste
                  </label>
                  <select
                    value={adjustment.reason}
                    onChange={(e) =>
                      setAdjustment({
                        ...adjustment,
                        reason: e.target.value as typeof adjustment.reason,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="increase">Entrada (+)</option>
                    <option value="decrease">Salida (-)</option>
                    <option value="correction">Corrección</option>
                    <option value="damage">Daño</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustment.delta}
                    onChange={(e) =>
                      setAdjustment({
                        ...adjustment,
                        delta: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="Cantidad a ajustar"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Positivo para entrada, negativo para salida
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nota (opcional)
                  </label>
                  <input
                    type="text"
                    value={adjustment.note}
                    onChange={(e) =>
                      setAdjustment({ ...adjustment, note: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="Motivo del ajuste"
                  />
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsAdjustModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={adjustMutation.isPending}>
                    Aplicar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AppLayout>
    </RequireRole>
  );
}
