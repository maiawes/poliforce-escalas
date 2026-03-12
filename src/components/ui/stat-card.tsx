import { ReactNode } from "react";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
};

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-100/60 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-slate-950">
            {value}
          </p>
          <p className="text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 p-3 text-white">{icon}</div>
      </div>
    </Card>
  );
}
