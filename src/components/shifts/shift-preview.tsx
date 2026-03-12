import { Clock3, Coins, SplitSquareVertical } from "lucide-react";
import { ShiftCalculation } from "@/types";
import { getDayTypeLabel, formatCurrency } from "@/lib/shifts/formatters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ShiftPreview({ calculation }: { calculation: ShiftCalculation | null }) {
  if (!calculation) {
    return null;
  }

  return (
    <Card className="space-y-5 bg-slate-950 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-white/10 text-white">{calculation.weekday}</Badge>
        <Badge className="bg-white/10 text-white">{getDayTypeLabel(calculation.dayType)}</Badge>
        <Badge className="bg-white/10 text-white">
          {calculation.isSplit ? "Escala dividida" : "Escala simples"}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock3 size={16} />
            Horas lançadas
          </div>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
            {calculation.totalHours.toFixed(2)}h
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Cobertura real: {calculation.coveredHours.toFixed(2)}h
            {calculation.overlapHours > 0
              ? ` • adicional simultâneo: ${calculation.overlapHours.toFixed(2)}h`
              : ` • limite do tipo: ${calculation.maxHours}h`}
          </p>
        </div>
        <div className="rounded-3xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Coins size={16} />
            Valor proporcional por hora
          </div>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
            {formatCurrency(calculation.proportionalHourlyRate)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Sobreposição conta como hora adicional proporcional para o agente
          </p>
        </div>
        <div className="rounded-3xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <SplitSquareVertical size={16} />
            Valor total atual
          </div>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
            {formatCurrency(calculation.totalAmount)}
          </p>
          <p className="mt-2 text-sm text-slate-400">Soma dos blocos informados</p>
        </div>
      </div>
      <div className="space-y-3">
        {calculation.blocks.map((block, index) => (
          <div
            key={`${block.agentId}-${block.startTime}-${index}`}
            className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
          >
            <span className="font-semibold">{block.agentName || "Agente não selecionado"}</span>
            <span className="text-slate-300">
              {block.startTime} às {block.endTime}
            </span>
            <span className="text-slate-300">{block.workedHours.toFixed(2)}h</span>
            <span className="font-semibold text-emerald-300">{formatCurrency(block.amount)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
