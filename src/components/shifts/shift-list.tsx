"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Copy, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { deleteShift, duplicateShift } from "@/lib/firebase/firestore";
import { formatCurrency, formatDate, formatMonthLabel, getDayTypeLabel } from "@/lib/shifts/formatters";
import { ShiftWithBlocks, Settings } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";

type ShiftListProps = {
  shifts: ShiftWithBlocks[];
  settings: Settings;
  monthKey: string;
  onMonthChange: (value: string) => void;
};

export function ShiftList({ shifts, settings, monthKey, onMonthChange }: ShiftListProps) {
  const [agentFilter, setAgentFilter] = useState("all");
  const [dayTypeFilter, setDayTypeFilter] = useState("all");
  const [splitFilter, setSplitFilter] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [busyId, setBusyId] = useState("");

  const filtered = shifts.filter((shift) => {
    const agentsLine = shift.blocks.map((block) => block.agentName).join(" ");

    const matchesAgent =
      agentFilter === "all" || shift.blocks.some((block) => block.agentId === agentFilter);
    const matchesDayType = dayTypeFilter === "all" || shift.dayType === dayTypeFilter;
    const matchesSplit =
      splitFilter === "all" ||
      (splitFilter === "split" ? shift.isSplit : !shift.isSplit);
    const matchesSearch =
      deferredSearch.trim() === "" ||
      agentsLine.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      shift.notes.toLowerCase().includes(deferredSearch.toLowerCase());

    return matchesAgent && matchesDayType && matchesSplit && matchesSearch;
  });

  const uniqueAgents = Array.from(
    new Map(
      shifts.flatMap((shift) =>
        shift.blocks.map((block) => [block.agentId, { id: block.agentId, name: block.agentName }]),
      ),
    ).values(),
  );

  const handleDelete = async (shiftId: string) => {
    const confirmed = window.confirm("Deseja excluir esta escala?");
    if (!confirmed) {
      return;
    }

    setBusyId(shiftId);
    try {
      await deleteShift(shiftId);
    } finally {
      setBusyId("");
    }
  };

  const handleDuplicate = async (shift: ShiftWithBlocks) => {
    const newDate = window.prompt("Informe a nova data no formato AAAA-MM-DD", shift.date);
    if (!newDate) {
      return;
    }

    setBusyId(shift.id);
    try {
      await duplicateShift(shift, newDate, settings);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mês de referência</label>
            <Input type="month" value={monthKey} onChange={(event) => onMonthChange(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Agente</label>
            <Select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
              <option value="all">Todos</option>
              {uniqueAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo de dia</label>
            <Select value={dayTypeFilter} onChange={(event) => setDayTypeFilter(event.target.value)}>
              <option value="all">Todos</option>
              <option value="SUNDAY_TO_THURSDAY">Domingo a quinta</option>
              <option value="FRIDAY_SATURDAY">Sexta ou sábado</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Escala dividida</label>
            <Select value={splitFilter} onChange={(event) => setSplitFilter(event.target.value)}>
              <option value="all">Todas</option>
              <option value="split">Somente divididas</option>
              <option value="simple">Somente simples</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Busca</label>
            <Input
              placeholder="Nome do agente ou observação"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <DataState
          title="Nenhuma escala encontrada"
          description={`Não há resultados para ${formatMonthLabel(monthKey)} com os filtros atuais.`}
          action={
            <Link href="/escalas/nova">
              <Button>
                <FilePlus2 size={16} />
                Nova escala
              </Button>
            </Link>
          }
        />
      ) : null}

      {filtered.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-sm xl:block">
            <div className="grid grid-cols-[0.8fr_0.8fr_1.1fr_2fr_0.8fr_1fr_0.9fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Data</span>
              <span>Dia</span>
              <span>Tipo</span>
              <span>Agentes</span>
              <span>Horas</span>
              <span>Total</span>
              <span>Ações</span>
            </div>
            {filtered.map((shift) => (
              <div
                key={shift.id}
                className="grid grid-cols-[0.8fr_0.8fr_1.1fr_2fr_0.8fr_1fr_0.9fr] gap-4 border-b border-slate-100 px-5 py-5 text-sm text-slate-700 last:border-b-0"
              >
                <span>{formatDate(shift.date)}</span>
                <span>{shift.weekday}</span>
                <div className="flex flex-col gap-2">
                  <span>{getDayTypeLabel(shift.dayType)}</span>
                  {shift.isSplit ? (
                    <Badge className="w-fit bg-amber-100 text-amber-800">Dividida</Badge>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {shift.blocks.map((block) => (
                    <div key={block.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                      <span className="font-semibold">{block.agentName}</span>
                      <span className="ml-2 text-slate-500">
                        {block.startTime} às {block.endTime}
                      </span>
                      <span className="ml-2 text-slate-500">{block.workedHours.toFixed(2)}h</span>
                      <span className="ml-2 font-semibold text-emerald-700">
                        {formatCurrency(block.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <span>{shift.totalHours.toFixed(2)}h</span>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-950">{formatCurrency(shift.totalAmount)}</p>
                  <p className="text-xs text-slate-500">{shift.notes || "Sem observações"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/escalas/${shift.id}/editar`}>
                    <Button variant="secondary" className="px-3 py-2">
                      <Pencil size={16} />
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    className="px-3 py-2"
                    onClick={() => handleDuplicate(shift)}
                    disabled={busyId === shift.id}
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-2"
                    onClick={() => handleDelete(shift.id)}
                    disabled={busyId === shift.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:hidden">
            {filtered.map((shift) => (
              <Card key={shift.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-950">
                      {formatDate(shift.date)}
                    </p>
                    <p className="text-sm text-slate-500">{shift.weekday}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{getDayTypeLabel(shift.dayType)}</Badge>
                    {shift.isSplit ? <Badge className="bg-amber-100 text-amber-800">Dividida</Badge> : null}
                  </div>
                </div>
                <div className="space-y-2">
                  {shift.blocks.map((block) => (
                    <div key={block.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900">{block.agentName}</p>
                      <p className="mt-1 text-slate-500">
                        {block.startTime} às {block.endTime} • {block.workedHours.toFixed(2)}h
                      </p>
                      <p className="mt-1 font-semibold text-emerald-700">{formatCurrency(block.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{shift.notes || "Sem observações"}</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(shift.totalAmount)}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/escalas/${shift.id}/editar`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      <Pencil size={16} />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleDuplicate(shift)}
                    disabled={busyId === shift.id}
                  >
                    <Copy size={16} />
                    Duplicar
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleDelete(shift.id)}
                    disabled={busyId === shift.id}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
