"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  active: boolean;
  mustChangePassword?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "ima_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse auth user from local storage", e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const setUser = (newUser: AuthUser | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
    // Call BetterAuth signOut to invalidate server session
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5001/auth"}/sign-out`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (e) {
      console.error("Error signing out", e);
    }
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
