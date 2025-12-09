import { useMutation } from "@tanstack/react-query";
import { login, LoginRequest, LoginResponse } from "../api/authClient";
import { useAuth } from "./AuthContext";

export function useLogin() {
  const { setUser } = useAuth();

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data);
      if (data.mustChangePassword) {
        window.location.href = "/change-password";
      } else {
        // Redirect based on role or default to dashboard
        window.location.href = "/dashboard";
      }
    },
  });
}
