"use client";

import React, { useState } from "react";
import { AppLayout } from "@/shared/layout/AppLayout";
import { RequireRole } from "@/features/auth/components/RequireRole";
import { Button } from "@/shared/ui/Button";
import {
  useWarehouseItems,
  useCreateWarehouseItem,
  useDeleteWarehouseItem,
} from "@/hooks/useWarehouse";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  X,
  Filter,
  Trash,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function InventarioPage() {
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    data: items,
    isLoading,
    error,
  } = useWarehouseItems({
    search: search || undefined,
  });

  const createMutation = useCreateWarehouseItem();
  const deleteMutation = useDeleteWarehouseItem();

  // Form state for create modal
  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    location: "",
    unit: "pza",
    stock: 0,
    min_quantity: 0,
    active: true,
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
        stock: 0,
        min_quantity: 0,
        active: true,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al crear item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este item?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert("Error al eliminar item");
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Client-side filtering for low stock and empty
  const filteredItems = React.useMemo(() => {
    if (!items) return items;
    let result = items;
    if (showLowStock) {
      result = result.filter(
        (item) =>
          item.min_quantity != null &&
          item.stock <= item.min_quantity
      );
    }
    if (hideEmpty) {
      result = result.filter((item) => item.stock > 0);
    }
    return result;
  }, [items, showLowStock, hideEmpty]);

  const sortedItems = React.useMemo(() => {
    if (!filteredItems || !sortField) return filteredItems;
    
    return [...filteredItems].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'status') {
        const isBelowMin = (item: typeof a) =>
          item.min_quantity != null && item.stock <= item.min_quantity;
        aVal = isBelowMin(a) || a.stock === 0 ? 0 : 1;
        bVal = isBelowMin(b) || b.stock === 0 ? 0 : 1;
      } else {
        aVal = a[sortField as keyof typeof a];
        bVal = b[sortField as keyof typeof b];
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredItems, sortField, sortDirection]);

  const isBelowMinimum = (item: { stock: number; min_quantity?: number | null }) =>
    item.min_quantity != null && item.stock <= item.min_quantity;

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
                  placeholder="Buscar por SKU, nombre, descripción o ubicación..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showLowStock
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Stock bajo
              </button>
              <button
                onClick={() => setHideEmpty(!hideEmpty)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${hideEmpty
                  ? "bg-gray-100 border-gray-400 text-gray-900"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Filter className="h-4 w-4" />
                Ocultar Agotados
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
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        onClick={() => handleSort('sku')}
                        className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          SKU
                          {sortField === 'sku' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={16} className="text-blue-600" /> : 
                              <ArrowDown size={16} className="text-blue-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Nombre
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={16} className="text-blue-600" /> : 
                              <ArrowDown size={16} className="text-blue-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('category')}
                        className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Categoría
                          {sortField === 'category' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={16} className="text-blue-600" /> : 
                              <ArrowDown size={16} className="text-blue-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('location')}
                        className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Ubicación
                          {sortField === 'location' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={16} className="text-blue-600" /> : 
                              <ArrowDown size={16} className="text-blue-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('stock')}
                        className="px-6 py-3 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Cantidad
                          {sortField === 'stock' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp size={16} className="text-blue-600" /> : 
                              <ArrowDown size={16} className="text-blue-600" />
                          )}
                        </div>
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
                    {sortedItems?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No hay items en el inventario
                        </td>
                      </tr>
                    ) : (
                      sortedItems?.map((item) => (
                        <tr key={item.id}>
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
                                isBelowMinimum(item) || item.stock === 0
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {item.stock} {item.unit || "pza"}
                            </span>
                            {isBelowMinimum(item) && (
                              <div className="text-xs text-red-500 mt-1">
                                Mín: {item.min_quantity}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                item.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
                    <select
                      value={newItem.location}
                      onChange={(e) =>
                        setNewItem({ ...newItem, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Nebraska64">Nebraska64</option>
                      <option value="Permanencia/Observatorio">
                        Permanencia/Observatorio
                      </option>
                      <option value="Talleres Zaragoza">Talleres Zaragoza</option>
                      <option value="Cuernavaca">Cuernavaca</option>
                    </select>
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
                      value={newItem.stock}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          stock: parseInt(e.target.value) || 0,
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
                      value={newItem.min_quantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          min_quantity: parseInt(e.target.value) || 0,
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
        </div>
      </AppLayout>
    </RequireRole>
  );
}
