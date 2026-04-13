import {
  DayType,
  Settings,
  ShiftCalculation,
  ShiftDraft,
  ShiftFormMode,
} from "@/types";
import { DEFAULT_SETTINGS, WEEKDAY_LABELS } from "./constants";
import { roundCurrency, toMonthKey } from "./formatters";
import { calculateCoveredHours, calculateWorkedHours, normalizeInterval } from "./time";

export function getWeekdayLabel(date: string) {
  return WEEKDAY_LABELS[new Date(`${date}T12:00:00`).getDay()];
}

export function getDayTypeFromDate(date: string): DayType {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) {
    return "SUNDAY";
  }

  if (day === 5 || day === 6) {
    return "FRIDAY_SATURDAY";
  }

  return "MONDAY_TO_THURSDAY";
}

export function getShiftRule(dayType: DayType, settings: Settings = DEFAULT_SETTINGS) {
  if (dayType === "SUNDAY") {
    const maxHours = calculateWorkedHours(
      settings.defaultStartTimeSunday,
      settings.defaultEndTimeSunday,
    );

    return {
      startTime: settings.defaultStartTimeSunday,
      endTime: settings.defaultEndTimeSunday,
      baseHourValue: settings.sundayHourValue,
      bonus: settings.sundayBonus,
      maxHours,
      totalAmount: roundCurrency(settings.sundayHourValue * maxHours + settings.sundayBonus),
    };
  }

  if (dayType === "FRIDAY_SATURDAY") {
    const maxHours = calculateWorkedHours(
      settings.defaultStartTimeFridaySaturday,
      settings.defaultEndTimeFridaySaturday,
    );

    return {
      startTime: settings.defaultStartTimeFridaySaturday,
      endTime: settings.defaultEndTimeFridaySaturday,
      baseHourValue: settings.fridaySaturdayHourValue,
      bonus: settings.fridaySaturdayBonus,
      maxHours,
      totalAmount: roundCurrency(settings.fridaySaturdayHourValue * maxHours + settings.fridaySaturdayBonus),
    };
  }

  const maxHours = calculateWorkedHours(
    settings.defaultStartTimeMondayToThursday,
    settings.defaultEndTimeMondayToThursday,
  );

  return {
    startTime: settings.defaultStartTimeMondayToThursday,
    endTime: settings.defaultEndTimeMondayToThursday,
    baseHourValue: settings.mondayToThursdayHourValue,
    bonus: settings.mondayToThursdayBonus,
    maxHours,
    totalAmount: roundCurrency(settings.mondayToThursdayHourValue * maxHours + settings.mondayToThursdayBonus),
  };
}

export function validateShiftDraft(draft: ShiftDraft, settings: Settings = DEFAULT_SETTINGS) {
  const errors: string[] = [];

  if (!draft.date) {
    errors.push("Informe a data da escala.");
  }

  if (!draft.blocks.length) {
    errors.push("Adicione ao menos um bloco de horário.");
  }

  const dayType = draft.date ? getDayTypeFromDate(draft.date) : "MONDAY_TO_THURSDAY";
  const rule = getShiftRule(dayType, settings);

  draft.blocks.forEach((block, index) => {
    if (!block.agentId) {
      errors.push(`Selecione o agente do bloco ${index + 1}.`);
    }

    if (!block.startTime || !block.endTime) {
      errors.push(`Preencha o horário do bloco ${index + 1}.`);
      return;
    }

    const workedHours = calculateWorkedHours(block.startTime, block.endTime);

    if (workedHours <= 0) {
      errors.push(`O bloco ${index + 1} precisa ter duração válida.`);
    }

    if (
      typeof block.manualAmount === "string" &&
      block.manualAmount.trim() !== "" &&
      Number(block.manualAmount) < 0
    ) {
      errors.push(`O valor manual do bloco ${index + 1} não pode ser negativo.`);
    }
  });

  const completedBlocks = draft.blocks.filter((block) => block.startTime && block.endTime);
  const coveredHours = calculateCoveredHours(completedBlocks, rule.startTime);

  if (coveredHours > rule.maxHours + 0.0001) {
    errors.push(
      `A cobertura total da escala não pode ultrapassar ${rule.maxHours} horas para esse tipo de escala.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateShift(draft: ShiftDraft, settings: Settings = DEFAULT_SETTINGS): ShiftCalculation {
  const dayType = getDayTypeFromDate(draft.date);
  const weekday = getWeekdayLabel(draft.date);
  const rule = getShiftRule(dayType, settings);
  const proportionalHourlyRate = roundCurrency(rule.totalAmount / rule.maxHours);

  const blocks = draft.blocks.map((block) => {
    const workedHours = roundCurrency(calculateWorkedHours(block.startTime, block.endTime));
    const calculatedAmount = roundCurrency(workedHours * (rule.totalAmount / rule.maxHours));
    const hasManualAmount =
      typeof block.manualAmount === "string" && block.manualAmount.trim() !== "";
    const manualAmount = hasManualAmount ? roundCurrency(Number(block.manualAmount)) : null;

    return {
      agentId: block.agentId,
      agentName: block.agentName,
      startTime: block.startTime,
      endTime: block.endTime,
      workedHours,
      hourlyRateCalculated: proportionalHourlyRate,
      calculatedAmount,
      manualAmount,
      isAmountManual: hasManualAmount,
      amount: hasManualAmount && manualAmount !== null ? manualAmount : calculatedAmount,
    };
  });

  const totalHours = roundCurrency(blocks.reduce((sum, block) => sum + block.workedHours, 0));
  const coveredHours = roundCurrency(calculateCoveredHours(blocks, rule.startTime));
  const overlapHours = roundCurrency(Math.max(totalHours - coveredHours, 0));
  const totalAmount = roundCurrency(blocks.reduce((sum, block) => sum + block.amount, 0));

  return {
    dayType,
    weekday,
    maxHours: rule.maxHours,
    proportionalHourlyRate,
    totalHours,
    coveredHours,
    overlapHours,
    totalAmount,
    isSplit: blocks.length > 1,
    blocks,
  };
}

export function getShiftMode(blocksCount: number): ShiftFormMode {
  return blocksCount > 1 ? "split" : "simple";
}

export function createEmptyBlock() {
  return {
    agentId: "",
    agentName: "",
    startTime: "",
    endTime: "",
    manualAmount: "",
  };
}

export function getDefaultTimesForDate(date: string, settings: Settings = DEFAULT_SETTINGS) {
  const dayType = getDayTypeFromDate(date);
  const rule = getShiftRule(dayType, settings);

  return {
    startTime: rule.startTime,
    endTime: rule.endTime,
  };
}

export function getMonthKeyFromDate(value: string) {
  return toMonthKey(new Date(`${value}T12:00:00`));
}

export function sortBlocksByTime<T extends { startTime: string; endTime: string }>(blocks: T[]) {
  return [...blocks].sort((current, next) => {
    const currentInterval = normalizeInterval(current.startTime, current.endTime);
    const nextInterval = normalizeInterval(next.startTime, next.endTime);
    return currentInterval.startMinutes - nextInterval.startMinutes;
  });
}
