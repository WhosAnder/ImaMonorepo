"use client";

import { Button } from "@/shared/ui/Button";
import { AlertTriangle, X } from "lucide-react";
import { useStopImpersonating } from "@/hooks/useAdminUsers";
import { authClient } from "@/shared/lib/auth";

export function ImpersonationBanner() {
  const stopImpersonating = useStopImpersonating();
  const { data: session } = authClient.useSession();

  // Check if current session is impersonated
  const isImpersonating = (session?.session as { impersonatedBy?: string } | null)?.impersonatedBy;

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-purple-600 to-purple-800 text-white py-2 px-4 flex items-center justify-center gap-4 shadow-lg">
      <AlertTriangle className="w-5 h-5 animate-pulse" />
      <span className="font-medium">
        Estás impersonando a otro usuario. Las acciones se realizarán en su nombre.
      </span>
      <Button
        variant="ghost"
        onClick={() => stopImpersonating.mutate()}
        disabled={stopImpersonating.isPending}
        className="!text-white hover:!bg-white/20 border border-white/30 !py-1 !px-3"
      >
        <X className="w-4 h-4 mr-1" />
        Salir de impersonación
      </Button>
    </div>
  );
}
