"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { useWorkers, useCreateWorker, useUpdateWorker, useToggleWorkerActive, usePermanentlyDeleteWorker } from "@/hooks/useWorkers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Loader2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AppLayout } from "@/shared/layout/AppLayout";

// Schemas
const workerSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
});

type WorkerFormValues = z.infer<typeof workerSchema>;

export default function WorkersPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<{ id: string; name: string } | null>(null);

  const { data: workers, isLoading } = useWorkers(search, showInactive);
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker();
  const toggleActiveMutation = useToggleWorkerActive();
  const permanentDeleteMutation = usePermanentlyDeleteWorker();

  // Create Form
  const createForm = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: "",
    },
  });

  // Edit Form
  const editForm = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: "",
    },
  });

  // Reset edit form when editingWorker changes
  useEffect(() => {
    if (editingWorker) {
      editForm.reset({ name: editingWorker.name });
    }
  }, [editingWorker, editForm]);

  useEffect(() => {
    if (isReady && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, isReady, router]);

  if (!isReady || !user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const onCreateSubmit = async (data: WorkerFormValues) => {
    await createMutation.mutateAsync({ name: data.name });
    setIsCreateOpen(false);
    createForm.reset();
  };

  const onUpdateSubmit = async (data: WorkerFormValues) => {
    if (!editingWorker) return;
    await updateMutation.mutateAsync({ id: editingWorker.id, data: { name: data.name } });
    setEditingWorker(null);
  };

  const handleToggleActive = async (id: string) => {
    await toggleActiveMutation.mutateAsync(id);
  };

  const handlePermanentDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar a este trabajador?")) {
      await permanentDeleteMutation.mutateAsync(id);
    }
  };

  return (
    <AppLayout title="Trabajadores">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
            <p className="text-gray-500">
              Gestiona el catálogo de trabajadores para los reportes.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Trabajador
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Trabajador</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Guardar
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-10 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm text-gray-600 cursor-pointer">
                Mostrar inactivos
              </Label>
            </div>
          </div>

          <div className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-6 py-3">Nombre</TableHead>
                  <TableHead className="px-6 py-3">Estado</TableHead>
                  <TableHead className="px-6 py-3 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : workers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No se encontraron trabajadores.
                    </TableCell>
                  </TableRow>
                ) : (
                  workers?.map((worker) => (
                    <TableRow key={worker._id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 font-medium">{worker.name}</TableCell>
                      <TableCell className="px-6 py-4">
                        {worker.active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none">Activo</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 shadow-none">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          {/* Toggle Active/Inactive */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={worker.active}
                              onCheckedChange={() => handleToggleActive(worker._id)}
                              disabled={toggleActiveMutation.isPending}
                              className={worker.active ? "data-[state=checked]:bg-green-600" : ""}
                            />
                            <span className={`text-xs font-medium ${worker.active ? "text-green-700" : "text-gray-500"}`}>
                              {worker.active ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          
                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => setEditingWorker({ id: worker._id, name: worker.name })}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          {/* Permanent Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handlePermanentDelete(worker._id)}
                            disabled={permanentDeleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={!!editingWorker} onOpenChange={(open) => !open && setEditingWorker(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Trabajador</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Actualizar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
