"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, CalendarRange, Coins, PlusCircle, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { useMonthlyData } from "@/hooks/use-monthly-data";
import { buildAgentChartData, buildDashboardSummary } from "@/lib/shifts/aggregation";
import { formatCurrency, formatMonthLabel, toMonthKey } from "@/lib/shifts/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";

export function DashboardPage() {
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const { shifts, loading } = useMonthlyData(monthKey);
  const summary = buildDashboardSummary(monthKey, shifts);
  const chartData = buildAgentChartData(shifts);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard operacional"
        description="Acompanhe o acumulado mensal, atalhos de operação e os agentes com maior repasse no período."
        actions={
          <>
            <input
              type="month"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500"
            />
            <Link href="/escalas/nova">
              <Button>
                <PlusCircle size={16} />
                Nova escala
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          label="Total geral do mês"
          value={formatCurrency(summary.totalPaid)}
          hint={formatMonthLabel(monthKey)}
          icon={<Coins size={22} />}
        />
        <StatCard
          label="Escalas cadastradas"
          value={`${summary.totalShifts}`}
          hint={`${summary.splitShifts} escalas divididas`}
          icon={<CalendarRange size={22} />}
        />
        <StatCard
          label="Horas lançadas"
          value={`${summary.totalHours.toFixed(2)}h`}
          hint={`${summary.totalAgentsWithWork} agentes com produção`}
          icon={<CalendarDays size={22} />}
        />
        <StatCard
          label="Agentes ativos no mês"
          value={`${summary.totalAgentsWithWork}`}
          hint="Totais atualizados em tempo real"
          icon={<Users size={22} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total por agente</p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
                Ranking mensal
              </h2>
            </div>
            <BarChart3 className="text-slate-300" size={22} />
          </div>
          {chartData.length === 0 ? (
            <DataState
              title="Sem dados ainda"
              description="Cadastre a primeira escala do mês para visualizar o ranking dos agentes."
            />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#0f4c81" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Atalhos rápidos</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Fluxos do dia a dia
            </h2>
          </div>
          <div className="grid gap-3">
            <Link href="/escalas/nova">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-300 hover:bg-sky-50">
                <p className="font-semibold text-slate-900">Cadastrar nova escala</p>
                <p className="mt-1 text-sm text-slate-500">Lance uma escala simples ou dividida com cálculo automático.</p>
              </div>
            </Link>
            <Link href="/escalas">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-300 hover:bg-sky-50">
                <p className="font-semibold text-slate-900">Visão geral do mês</p>
                <p className="mt-1 text-sm text-slate-500">Filtre por agente, tipo de dia e procure escalas com rapidez.</p>
              </div>
            </Link>
            <Link href="/relatorios">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-300 hover:bg-sky-50">
                <p className="font-semibold text-slate-900">Relatórios em tempo real</p>
                <p className="mt-1 text-sm text-slate-500">Analise comparativos, gráficos e exporte PDF ou Excel.</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Acumulado por agente</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Consolidação do mês
            </h2>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Carregando dados do dashboard...</p>
        ) : summary.perAgent.length === 0 ? (
          <DataState
            title="Ainda não há repasses no mês"
            description="Assim que as escalas forem cadastradas, os totais e relatórios aparecerão aqui."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {summary.perAgent.map((agent) => (
              <Link key={agent.agentId} href={`/agentes/${agent.agentId}`}>
                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{agent.agentName}</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-400">Mês</span>
                  </div>
                  <p className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-slate-950">
                    {formatCurrency(agent.totalAmount)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>{agent.totalHours.toFixed(2)}h</span>
                    <span>{agent.totalShifts} escalas</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
