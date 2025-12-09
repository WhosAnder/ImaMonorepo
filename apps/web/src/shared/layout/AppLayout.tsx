"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABELS } from "@/features/auth/types/roles";
import { navConfig } from "@/shared/navigation/navConfig";
import { themes } from "@/shared/theme/colors";
import { Menu, Search, Bell, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { ImpersonationBanner } from "@/features/admin/components/ImpersonationBanner";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = "IMA Soluciones",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null; // Or a loading spinner

  const roleNav = navConfig[user.role as keyof typeof navConfig] || navConfig.warehouse;

  // Determine theme color based on role
  const themeColor =
    user.role === "admin"
      ? themes.admin.primary
      : user.role === "warehouse"
        ? themes.warehouse.primary
        : themes.work.primary;

  return (
    <>
      <ImpersonationBanner />
      <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 flex flex-col justify-center px-6 border-b border-gray-100">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            IMA Soluciones
          </span>
          <span className="text-lg font-bold" style={{ color: themeColor }}>
            Plataforma
          </span>
        </div>

        <nav className="p-4 space-y-1">
          {roleNav.main.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                    ${
                                      isActive
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }
                                `}
                style={
                  isActive
                    ? {
                        borderLeft: `4px solid ${themeColor}`,
                        backgroundColor: `${themeColor}10`,
                        color: themeColor,
                      }
                    : {}
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: themeColor }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-4 p-2 text-gray-500 hover:bg-gray-100 rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
              <div
                className="lg:hidden text-xs text-gray-500"
                style={{ color: themeColor }}
              >
                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Panel Admin
              </Link>
            )}

            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none focus:outline-none text-sm text-gray-700 w-full"
              />
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center pl-4 border-l border-gray-200">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2"
                style={{ backgroundColor: themeColor }}
              >
                {user.name.charAt(0)}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
    </>
  );
};
