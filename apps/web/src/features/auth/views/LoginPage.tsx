"use client";
import React, { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { login as loginApi } from "@/api/authClient";

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<
    string | null
  >(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "El correo electrónico es obligatorio";
    }
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const userData = await loginApi({ email, password });
      login(userData);

      if (userData.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : "Error al iniciar sesión",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <img
            src="logo-ima.png"
            alt="IMA Logo"
            className="h-12 w-auto"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-1">
              IMA Soluciones
            </h1>
            <h2 className="text-lg font-semibold text-gray-700">
              Acceso a IMA Cloud
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="usuario@imasoluciones.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {errors.general}
            </div>
          )}

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMessage(
                    "Para restablecer tu contraseña contáctate con tu administrador"
                  );
                }}
                className="font-medium text-blue-600 hover:text-blue-500 bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            {forgotPasswordMessage && (
              <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200 w-full text-center">
                {forgotPasswordMessage}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  );
};
