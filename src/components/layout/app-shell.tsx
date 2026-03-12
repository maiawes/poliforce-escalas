"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  ClipboardList,
  Home,
  Settings,
  Sheet,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/escalas", label: "Escalas", icon: CalendarRange },
  { href: "/escalas/nova", label: "Nova escala", icon: ClipboardList },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/planilha", label: "Planilha", icon: Sheet },
  { href: "/agentes", label: "Agentes", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#daf3ff,transparent_30%),linear-gradient(180deg,#f6fbfe_0%,#eef3f6_40%,#e8eef2_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[32px] border border-white/70 bg-slate-950 px-5 py-6 text-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.75)] lg:flex">
          <div className="px-2">
            <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight">
              Poliforce
            </p>
            <p className="mt-1 text-sm text-slate-400">Gestão de escalas e repasses em tempo real</p>
          </div>
          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-white text-slate-950 shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Sem autenticação, sem backend extra</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              O app conversa direto com o Firestore e fica pronto para publicar na Vercel.
            </p>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto rounded-[24px] border border-white/70 bg-white/80 p-2 shadow-sm lg:hidden">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition",
                    active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <main className="min-w-0 flex-1 rounded-[32px] border border-white/70 bg-white/55 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
