"use client";

import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardSummary, ShiftWithBlocks } from "@/types";
import { getDayTypeFromDate } from "./calculations";
import { buildExportRows } from "./aggregation";
import { formatCurrency, formatDate, formatMonthLabel, getDayTypeLabel } from "./formatters";

export function exportMonthlyExcel(monthKey: string, shifts: ShiftWithBlocks[]) {
  const worksheet = utils.json_to_sheet(buildExportRows(shifts));
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Escalas");
  writeFile(workbook, `poliforce-escalas-${monthKey}.xlsx`);
}

export function exportMonthlyPdf(
  monthKey: string,
  summary: DashboardSummary,
  shifts: ShiftWithBlocks[],
) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  pdf.setFontSize(20);
  pdf.text("Poliforce Escalas", 14, 18);
  pdf.setFontSize(11);
  pdf.text(`Relatorio mensal - ${formatMonthLabel(monthKey)}`, 14, 25);
  pdf.text(`Total geral: ${formatCurrency(summary.totalPaid)}`, 14, 31);
  pdf.text(`Escalas: ${summary.totalShifts}`, 90, 31);
  pdf.text(`Escalas divididas: ${summary.splitShifts}`, 130, 31);
  pdf.text(`Horas no mes: ${summary.totalHours.toFixed(2)}h`, 190, 31);

  autoTable(pdf, {
    startY: 38,
    head: [["Data", "Dia", "Tipo", "Agentes e horarios", "Total", "Observacoes"]],
    body: shifts.map((shift) => [
      formatDate(shift.date),
      shift.weekday,
      getDayTypeLabel(getDayTypeFromDate(shift.date)),
      shift.blocks
        .map(
          (block) =>
            `${block.agentName} ${block.startTime}-${block.endTime} ${block.workedHours.toFixed(2)}h ${formatCurrency(block.amount)}`,
        )
        .join("\n"),
      formatCurrency(shift.totalAmount),
      shift.notes || "-",
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [15, 76, 129],
    },
  });

  pdf.addPage("a4", "portrait");
  pdf.setFontSize(18);
  pdf.text("Consolidado por agente", 14, 18);

  autoTable(pdf, {
    startY: 24,
    head: [["Agente", "Total", "Horas", "Escalas", "Media por escala"]],
    body: summary.perAgent.map((item) => [
      item.agentName,
      formatCurrency(item.totalAmount),
      `${item.totalHours.toFixed(2)}h`,
      `${item.totalShifts}`,
      formatCurrency(item.averagePerShift),
    ]),
    headStyles: {
      fillColor: [26, 161, 184],
    },
  });

  pdf.save(`poliforce-relatorio-${monthKey}.pdf`);
}

export function exportAgentPdf(
  agentName: string,
  monthKey: string,
  shifts: ShiftWithBlocks[],
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const relatedShifts = shifts.filter((shift) =>
    shift.blocks.some((block) => block.agentName === agentName),
  );
  const total = relatedShifts.reduce((sum, shift) => {
    const partial = shift.blocks
      .filter((block) => block.agentName === agentName)
      .reduce((blockSum, block) => blockSum + block.amount, 0);

    return sum + partial;
  }, 0);

  pdf.setFontSize(20);
  pdf.text(`Relatorio de ${agentName}`, 14, 18);
  pdf.setFontSize(11);
  pdf.text(`Mes: ${formatMonthLabel(monthKey)}`, 14, 25);
  pdf.text(`Total acumulado: ${formatCurrency(total)}`, 14, 31);

  autoTable(pdf, {
    startY: 38,
    head: [["Data", "Horario", "Horas", "Valor"]],
    body: relatedShifts.flatMap((shift) =>
      shift.blocks
        .filter((block) => block.agentName === agentName)
        .map((block) => [
          formatDate(shift.date),
          `${block.startTime} - ${block.endTime}`,
          `${block.workedHours.toFixed(2)}h`,
          formatCurrency(block.amount),
        ]),
    ),
    headStyles: {
      fillColor: [15, 76, 129],
    },
  });

  pdf.save(`poliforce-${agentName.toLowerCase().replaceAll(" ", "-")}-${monthKey}.pdf`);
}

export function exportAgentExcel(
  agentName: string,
  monthKey: string,
  shifts: ShiftWithBlocks[],
) {
  const relatedRows = shifts.flatMap((shift) =>
    shift.blocks
      .filter((block) => block.agentName === agentName)
      .map((block) => ({
        Data: formatDate(shift.date),
        Dia: shift.weekday,
        Tipo: getDayTypeLabel(getDayTypeFromDate(shift.date)),
        Inicio: block.startTime,
        Fim: block.endTime,
        Horas: block.workedHours,
        Valor: block.amount,
        Observacoes: shift.notes || "-",
      })),
  );

  const worksheet = utils.json_to_sheet(relatedRows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Agente");
  writeFile(
    workbook,
    `poliforce-${agentName.toLowerCase().replaceAll(" ", "-")}-${monthKey}.xlsx`,
  );
}
