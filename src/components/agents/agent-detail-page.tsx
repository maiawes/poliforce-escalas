"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { exportAgentExcel, exportAgentPdf } from "@/lib/shifts/export";
import { useAgents } from "@/hooks/use-agents";
import { useMonthlyData } from "@/hooks/use-monthly-data";
import { buildAgentEvolution } from "@/lib/shifts/aggregation";
import { formatCurrency, formatDate, toMonthKey } from "@/lib/shifts/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Coins, Download, FileSpreadsheet, TimerReset, Workflow } from "lucide-react";
import { DataState } from "@/components/ui/data-state";

type AgentDetailPageProps = {
  agentId: string;
};

function getMonthProjection(monthKey: string, total: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysInMonth = new Date(year, month, 0).getDate();

  if (!isCurrentMonth) {
    return total;
  }

  const elapsedDays = Math.max(today.getDate(), 1);
  return (total / elapsedDays) * daysInMonth;
}

export function AgentDetailPage({ agentId }: AgentDetailPageProps) {
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const { agents, loading: loadingAgents } = useAgents();
  const { shifts, loading } = useMonthlyData(monthKey);
  const agent = agents.find((item) => item.id === agentId);

  if (!loadingAgents && !agent) {
    return (
      <DataState
        title="Agente não encontrado"
        description="Não foi possível localizar o agente solicitado."
      />
    );
  }

  const relatedShifts = shifts.filter((shift) =>
    shift.blocks.some((block) => block.agentId === agentId),
  );
  const totalAmount = relatedShifts.reduce(
    (sum, shift) =>
      sum +
      shift.blocks
        .filter((block) => block.agentId === agentId)
        .reduce((blockSum, block) => blockSum + block.amount, 0),
    0,
  );
  const totalHours = relatedShifts.reduce(
    (sum, shift) =>
      sum +
      shift.blocks
        .filter((block) => block.agentId === agentId)
        .reduce((blockSum, block) => blockSum + block.workedHours, 0),
    0,
  );
  const projection = getMonthProjection(monthKey, totalAmount);
  const chartData = buildAgentEvolution(agentId, shifts);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agente"
        title={agent?.name ?? "Carregando agente"}
        description="Acompanhe o acumulado do mês, a evolução por dia e a estimativa de fechamento."
        actions={
          <>
            <input
              type="month"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
            />
            {agent ? (
              <>
                <Button onClick={() => exportAgentPdf(agent.name, monthKey, shifts)}>
                  <Download size={16} />
                  Exportar PDF
                </Button>
                <Button variant="secondary" onClick={() => exportAgentExcel(agent.name, monthKey, shifts)}>
                  <FileSpreadsheet size={16} />
                  Exportar Excel
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Acumulado no mês"
          value={formatCurrency(totalAmount)}
          hint="Valor já apurado"
          icon={<Coins size={22} />}
        />
        <StatCard
          label="Horas trabalhadas"
          value={`${totalHours.toFixed(2)}h`}
          hint="Somatório dos blocos"
          icon={<TimerReset size={22} />}
        />
        <StatCard
          label="Quantidade de escalas"
          value={`${relatedShifts.length}`}
          hint="Escalas com participação do agente"
          icon={<Workflow size={22} />}
        />
        <StatCard
          label="Estimativa de fechamento"
          value={formatCurrency(projection)}
          hint="Projeção baseada no ritmo do mês"
          icon={<Coins size={22} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Evolução diária</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Trajetória do mês
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="agentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0f4c81" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Area type="monotone" dataKey="total" stroke="#0f4c81" fill="url(#agentArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Detalhamento por data</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Escalas do mês
            </h2>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Carregando escalas...</p>
          ) : (
            <div className="space-y-3">
              {relatedShifts.map((shift) => (
                <div key={shift.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{formatDate(shift.date)}</p>
                      <p className="text-sm text-slate-500">{shift.weekday}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(
                        shift.blocks
                          .filter((block) => block.agentId === agentId)
                          .reduce((sum, block) => sum + block.amount, 0),
                      )}
                    </p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {shift.blocks
                      .filter((block) => block.agentId === agentId)
                      .map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm"
                        >
                          <span>
                            {block.startTime} às {block.endTime}
                          </span>
                          <span>{block.workedHours.toFixed(2)}h</span>
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(block.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
