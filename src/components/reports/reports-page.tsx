"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { useMonthlyData } from "@/hooks/use-monthly-data";
import {
  buildAgentChartData,
  buildDailyChartData,
  buildDashboardSummary,
  buildWeeklyChartData,
} from "@/lib/shifts/aggregation";
import { exportAgentExcel, exportAgentPdf, exportMonthlyExcel, exportMonthlyPdf } from "@/lib/shifts/export";
import { formatCurrency, toMonthKey } from "@/lib/shifts/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ReportsPage() {
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const { shifts } = useMonthlyData(monthKey);
  const summary = buildDashboardSummary(monthKey, shifts);
  const agentChartData = buildAgentChartData(shifts);
  const weeklyChartData = buildWeeklyChartData(shifts);
  const dailyChartData = buildDailyChartData(shifts);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="BI"
        title="Relatórios em tempo real"
        description="Compare agentes, acompanhe o comportamento semanal e gere relatórios consolidados para fechamento."
        actions={
          <>
            <input
              type="month"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
            />
            <Button onClick={() => exportMonthlyPdf(monthKey, summary, shifts)}>
              <Download size={16} />
              Exportar PDF
            </Button>
            <Button variant="secondary" onClick={() => exportMonthlyExcel(monthKey, shifts)}>
              <FileSpreadsheet size={16} />
              Exportar Excel
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total geral</p>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            {formatCurrency(summary.totalPaid)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Horas totais</p>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            {summary.totalHours.toFixed(2)}h
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Escalas por agente</p>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            {summary.perAgent.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Escalas divididas</p>
          <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            {summary.splitShifts}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Comparação entre agentes</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Valor por agente
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#1aa1b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Total por semana</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Ritmo semanal
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Line dataKey="total" type="monotone" stroke="#0f4c81" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Total por dia</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Curva diária
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#0f4c81" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Tabela consolidada mensal</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Resumo por agente
            </h2>
          </div>
          <div className="space-y-3">
            {summary.perAgent.map((item) => (
              <div
                key={item.agentId}
                className="grid grid-cols-[1.1fr_0.8fr_0.7fr_0.7fr_0.8fr_1.1fr] gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm"
              >
                <span className="font-semibold text-slate-900">{item.agentName}</span>
                <span>{formatCurrency(item.totalAmount)}</span>
                <span>{item.totalHours.toFixed(2)}h</span>
                <span>{item.totalShifts}</span>
                <span>{formatCurrency(item.averagePerShift)}</span>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="px-3"
                    onClick={() => exportAgentPdf(item.agentName, monthKey, shifts)}
                  >
                    <Download size={16} />
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3"
                    onClick={() => exportAgentExcel(item.agentName, monthKey, shifts)}
                  >
                    <FileSpreadsheet size={16} />
                    Excel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
