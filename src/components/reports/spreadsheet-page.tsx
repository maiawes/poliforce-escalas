"use client";

import { useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { useMonthlyData } from "@/hooks/use-monthly-data";
import { buildConsolidatedMatrix } from "@/lib/shifts/aggregation";
import { formatCurrency, toMonthKey } from "@/lib/shifts/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export function SpreadsheetPage() {
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const { agents } = useAgents();
  const { shifts } = useMonthlyData(monthKey);
  const activeAgents = agents.filter((agent) => agent.active);
  const rows = buildConsolidatedMatrix(activeAgents, shifts);
  const days = [...new Set(shifts.map((shift) => shift.date.slice(8, 10)))];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Consolidação"
        title="Tela estilo planilha"
        description="Visualize rapidamente quanto cada agente recebeu em cada dia do mês e o total final da linha."
        actions={
          <input
            type="month"
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
          />
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="sticky left-0 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-700">
                  Agente
                </th>
                {days.map((day) => (
                  <th key={day} className="px-4 py-4 text-right font-semibold text-slate-700">
                    {day}
                  </th>
                ))}
                <th className="px-4 py-4 text-right font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.agentId} className="border-t border-slate-100">
                  <td className="sticky left-0 bg-white px-4 py-4 font-semibold text-slate-900">
                    {row.agentName}
                  </td>
                  {days.map((day) => (
                    <td key={day} className="px-4 py-4 text-right text-slate-600">
                      {row.dailyValues[day] ? formatCurrency(row.dailyValues[day]) : "-"}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right font-semibold text-slate-950">
                    {formatCurrency(row.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
