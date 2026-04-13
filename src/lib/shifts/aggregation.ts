import {
  Agent,
  ConsolidatedMatrixRow,
  DashboardSummary,
  ExportRow,
  ShiftBlock,
  ShiftWithBlocks,
} from "@/types";
import { getDayTypeFromDate } from "./calculations";
import { formatDate, getDayTypeLabel, roundCurrency } from "./formatters";

export function combineShiftsAndBlocks(shifts: ShiftWithBlocks[], blocks: ShiftBlock[]) {
  return shifts.map((shift) => ({
    ...shift,
    blocks: blocks
      .filter((block) => block.shiftId === shift.id)
      .sort((current, next) => current.sortOrder - next.sortOrder),
  }));
}

export function attachBlocks(shifts: Omit<ShiftWithBlocks, "blocks">[], blocks: ShiftBlock[]): ShiftWithBlocks[] {
  return shifts
    .map((shift) => ({
      ...shift,
      blocks: blocks
        .filter((block) => block.shiftId === shift.id)
        .sort((current, next) => current.sortOrder - next.sortOrder),
    }))
    .sort((current, next) => current.date.localeCompare(next.date));
}

export function buildDashboardSummary(monthKey: string, shifts: ShiftWithBlocks[]): DashboardSummary {
  const agentMap = new Map<string, DashboardSummary["perAgent"][number]>();

  shifts.forEach((shift) => {
    shift.blocks.forEach((block) => {
      const current = agentMap.get(block.agentId) ?? {
        agentId: block.agentId,
        agentName: block.agentName,
        totalAmount: 0,
        totalHours: 0,
        totalShifts: 0,
        averagePerShift: 0,
      };

      current.totalAmount += block.amount;
      current.totalHours += block.workedHours;
      current.totalShifts += 1;
      current.averagePerShift = current.totalAmount / current.totalShifts;

      agentMap.set(block.agentId, current);
    });
  });

  const perAgent = [...agentMap.values()]
    .map((summary) => ({
      ...summary,
      totalAmount: roundCurrency(summary.totalAmount),
      totalHours: roundCurrency(summary.totalHours),
      averagePerShift: roundCurrency(summary.averagePerShift),
    }))
    .sort((current, next) => next.totalAmount - current.totalAmount);

  return {
    monthKey,
    totalPaid: roundCurrency(shifts.reduce((sum, shift) => sum + shift.totalAmount, 0)),
    totalShifts: shifts.length,
    splitShifts: shifts.filter((shift) => shift.isSplit).length,
    totalHours: roundCurrency(
      shifts.reduce(
        (sum, shift) =>
          sum + shift.blocks.reduce((blockSum, block) => blockSum + block.workedHours, 0),
        0,
      ),
    ),
    perAgent,
    totalAgentsWithWork: perAgent.length,
  };
}

export function buildWeeklyChartData(shifts: ShiftWithBlocks[]) {
  const totals = new Map<string, number>();

  shifts.forEach((shift) => {
    const week = `${shift.date.slice(8, 10)}-${shift.weekday}`;
    totals.set(week, roundCurrency((totals.get(week) ?? 0) + shift.totalAmount));
  });

  return [...totals.entries()].map(([label, total]) => ({
    label,
    total,
  }));
}

export function buildDailyChartData(shifts: ShiftWithBlocks[]) {
  return shifts.map((shift) => ({
    label: shift.date.slice(8, 10),
    total: shift.totalAmount,
  }));
}

export function buildAgentChartData(shifts: ShiftWithBlocks[]) {
  const summary = buildDashboardSummary("", shifts);

  return summary.perAgent.map((item) => ({
    name: item.agentName,
    total: item.totalAmount,
    horas: item.totalHours,
  }));
}

export function buildAgentEvolution(agentId: string, shifts: ShiftWithBlocks[]) {
  return shifts
    .filter((shift) => shift.blocks.some((block) => block.agentId === agentId))
    .map((shift) => {
      const total = shift.blocks
        .filter((block) => block.agentId === agentId)
        .reduce((sum, block) => sum + block.amount, 0);

      return {
        label: shift.date.slice(8, 10),
        total: roundCurrency(total),
      };
    });
}

export function buildConsolidatedMatrix(agents: Agent[], shifts: ShiftWithBlocks[]): ConsolidatedMatrixRow[] {
  const days = [...new Set(shifts.map((shift) => shift.date.slice(8, 10)))];

  return agents.map((agent) => {
    const dailyValues = Object.fromEntries(days.map((day) => [day, 0]));

    shifts.forEach((shift) => {
      const day = shift.date.slice(8, 10);
      const total = shift.blocks
        .filter((block) => block.agentId === agent.id)
        .reduce((sum, block) => sum + block.amount, 0);

      dailyValues[day] = roundCurrency((dailyValues[day] ?? 0) + total);
    });

    return {
      agentId: agent.id,
      agentName: agent.name,
      dailyValues,
      totalAmount: roundCurrency(
        Object.values(dailyValues).reduce((sum, value) => sum + value, 0),
      ),
    };
  });
}

export function buildExportRows(shifts: ShiftWithBlocks[]): ExportRow[] {
  return shifts.map((shift) => ({
    data: formatDate(shift.date),
    dia: shift.weekday,
    tipo: getDayTypeLabel(getDayTypeFromDate(shift.date)),
    agentes: shift.blocks
      .map(
        (block) =>
          `${block.agentName} ${block.startTime}-${block.endTime} (${block.workedHours.toFixed(2)}h)`,
      )
      .join(" | "),
    horas: shift.blocks.map((block) => `${block.agentName}: ${block.workedHours.toFixed(2)}h`).join(" | "),
    valor: shift.totalAmount,
    observacoes: shift.notes || "-",
  }));
}
