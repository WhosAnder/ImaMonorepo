import { authClient } from "@/shared/lib/auth";

/**
 * Simple helper hook that exposes authentication state derived
 * from the Better Auth session store.
 */
export function useAuth() {
  const sessionState = authClient.useSession();
  const session = sessionState.data?.session ?? null;
  const user = sessionState.data?.user ?? null;

  return {
    ...sessionState,
    session,
    user,
    isAuth: Boolean(user),
    isLoading: sessionState.isPending,
  };
}
