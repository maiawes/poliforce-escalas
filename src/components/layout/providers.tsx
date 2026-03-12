"use client";

import { ReactNode } from "react";
import { useBootstrap } from "@/hooks/use-bootstrap";

export function Providers({ children }: { children: ReactNode }) {
  const bootstrapped = useBootstrap();

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#d6f3ff,transparent_40%),linear-gradient(180deg,#f5fbff_0%,#eef4f8_100%)] px-6">
        <div className="rounded-[32px] border border-white/70 bg-white/85 px-8 py-6 text-center shadow-xl backdrop-blur">
          <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
            Poliforce Escalas
          </p>
          <p className="mt-2 text-sm text-slate-500">Preparando dados iniciais do sistema...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
