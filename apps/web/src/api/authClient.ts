import { AUTH_URL } from "../config/env";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id: string;
  email: string;
  role: string;
  name: string;
  active: boolean;
  mustChangePassword?: boolean;
};

export type RegisterRequest = {
  email: string;
  password: string;
  role: string;
};

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Required to receive and send session cookies
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al iniciar sesión");
  }

  return response.json();
}

export async function register(payload: RegisterRequest): Promise<{ success: boolean }> {
  const response = await fetch(`${AUTH_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al registrarse");
  }

  return response.json();
}
