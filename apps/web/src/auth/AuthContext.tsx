"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  active: boolean;
  mustChangePassword: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "ima_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUserState({
          ...parsed,
          mustChangePassword: Boolean(parsed.mustChangePassword),
        });
      } catch (e) {
        console.error("Failed to parse auth user from local storage", e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsReady(true);
  }, []);

  const setUser = (newUser: AuthUser | null) => {
    if (newUser) {
      const normalizedUser: AuthUser = {
        ...newUser,
        mustChangePassword: Boolean(newUser.mustChangePassword),
      };
      setUserState(normalizedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUserState(null);
    }
    setIsReady(true);
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
        },
      );
    } catch (e) {
      console.error("Error signing out", e);
    }
    window.location.href = "/login";
  };

  useEffect(() => {
    if (!isReady || !user) {
      return;
    }

    if (user.mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
    }
  }, [user, router, pathname, isReady]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isReady }}>
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
