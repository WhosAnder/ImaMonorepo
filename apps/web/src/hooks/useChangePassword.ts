import { useMutation } from "@tanstack/react-query";

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5001/auth";

type ChangePasswordPayload = {
  currentPassword?: string; // Optional if forcing change without knowing current? Usually required though.
  newPassword: string;
};

async function changePassword(payload: ChangePasswordPayload) {
  const response = await fetch(`${AUTH_BASE_URL}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to change password");
  }

  return response.json();
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
