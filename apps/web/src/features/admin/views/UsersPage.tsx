"use client";

import React, { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Plus, Pencil, Trash2, X, Ban, CheckCircle, UserCheck } from "lucide-react";
import type { UserRole } from "@/features/auth/types/roles";
import { ROLE_LABELS } from "@/features/auth/types/roles";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSetUserRole,
  useBanUser,
  useUnbanUser,
  useImpersonateUser,
} from "@/hooks/useAdminUsers";

// User type from BetterAuth admin plugin
type BetterAuthUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
};

export const UsersPage: React.FC = () => {
  const { data: users, isLoading, error } = useAdminUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const setRoleMutation = useSetUserRole();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const impersonateMutation = useImpersonateUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<BetterAuthUser | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("warehouse");
  const [password, setPassword] = useState("");

  const handleOpenModal = (user?: BetterAuthUser) => {
    if (user) {
      setCurrentUser(user);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role || "warehouse");
      setPassword("");
    } else {
      setCurrentUser(null);
      setName("");
      setEmail("");
      setRole("warehouse");
      setPassword("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser) {
      // Edit - update name and role separately
      await updateUserMutation.mutateAsync({
        id: currentUser.id,
        payload: { name },
      });
      if (role !== currentUser.role) {
        await setRoleMutation.mutateAsync({
          userId: currentUser.id,
          role,
        });
      }
    } else {
      // Create
      await createUserMutation.mutateAsync({
        name,
        email,
        password,
        role,
      });
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      await deleteUserMutation.mutateAsync(id);
    }
  };

  const handleBanToggle = async (user: BetterAuthUser) => {
    if (user.banned) {
      await unbanMutation.mutateAsync(user.id);
    } else {
      await banMutation.mutateAsync({ userId: user.id, banReason: "Desactivado por admin" });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar usuarios: {error.message}
      </div>
    );
  }

  const getRoleLabel = (role: string | null): string => {
    if (!role) return "Sin rol";
    return ROLE_LABELS[role as UserRole] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500">
            Administra los usuarios y sus roles en la plataforma
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(users as BetterAuthUser[] | undefined)?.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!user.banned ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Baneado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleBanToggle(user)}
                    className={`mr-3 ${user.banned ? "text-green-600 hover:text-green-900" : "text-yellow-600 hover:text-yellow-900"}`}
                    title={user.banned ? "Desbanear" : "Banear"}
                  >
                    {user.banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900 mr-3"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {user.role !== "admin" && (
                    <button
                      onClick={() => impersonateMutation.mutate(user.id)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Impersonar usuario"
                      disabled={impersonateMutation.isPending}
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!currentUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="warehouse">Almacenista</option>
                </select>
              </div>

              {!currentUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} className="mr-3">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={
                    createUserMutation.isPending ||
                    updateUserMutation.isPending ||
                    setRoleMutation.isPending
                  }
                >
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
