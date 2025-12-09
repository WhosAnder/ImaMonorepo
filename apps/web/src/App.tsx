"use client";
import { LoginPage } from "./features/auth/views/LoginPage";
import { DashboardPage } from "./features/dashboard/views/DashboardPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import { useEffect } from "react";

function App() {
  const userState = useAuth();
  const { user, isLoading } = userState;

  useEffect(() => {
    console.log(userState);
  }, [userState]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando sesión...
      </div>
    );
  }
  if (!user) {
    return <LoginPage />;
  }

  return <DashboardPage />;
}

export default App;
