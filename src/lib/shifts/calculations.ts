import {
  DayType,
  Settings,
  ShiftCalculation,
  ShiftDraft,
  ShiftFormMode,
} from "@/types";
import { DEFAULT_SETTINGS, WEEKDAY_LABELS } from "./constants";
import { roundCurrency, toMonthKey } from "./formatters";
import { calculateWorkedHours, intervalsOverlap, normalizeInterval } from "./time";

export function getWeekdayLabel(date: string) {
  return WEEKDAY_LABELS[new Date(`${date}T12:00:00`).getDay()];
}

export function getDayTypeFromDate(date: string): DayType {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 5 || day === 6 ? "FRIDAY_SATURDAY" : "SUNDAY_TO_THURSDAY";
}

export function getShiftRule(dayType: DayType, settings: Settings = DEFAULT_SETTINGS) {
  if (dayType === "FRIDAY_SATURDAY") {
    const maxHours = calculateWorkedHours(
      settings.defaultStartTimeWeekend,
      settings.defaultEndTimeWeekend,
    );

    return {
      startTime: settings.defaultStartTimeWeekend,
      endTime: settings.defaultEndTimeWeekend,
      baseHourValue: settings.fridaySaturdayHourValue,
      bonus: settings.fridaySaturdayBonus,
      maxHours,
      totalAmount: roundCurrency(settings.fridaySaturdayHourValue * maxHours + settings.fridaySaturdayBonus),
    };
  }

  const maxHours = calculateWorkedHours(
    settings.defaultStartTimeWeek,
    settings.defaultEndTimeWeek,
  );

  return {
    startTime: settings.defaultStartTimeWeek,
    endTime: settings.defaultEndTimeWeek,
    baseHourValue: settings.sundayToThursdayHourValue,
    bonus: settings.sundayToThursdayBonus,
    maxHours,
    totalAmount: roundCurrency(settings.sundayToThursdayHourValue * maxHours + settings.sundayToThursdayBonus),
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

  const dayType = draft.date ? getDayTypeFromDate(draft.date) : "SUNDAY_TO_THURSDAY";
  const rule = getShiftRule(dayType, settings);
  let totalHours = 0;

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

    totalHours += workedHours;
  });

  for (let index = 0; index < draft.blocks.length; index += 1) {
    for (let compare = index + 1; compare < draft.blocks.length; compare += 1) {
      if (intervalsOverlap(draft.blocks[index], draft.blocks[compare])) {
        errors.push("Existem horários sobrepostos na mesma escala.");
        index = draft.blocks.length;
        break;
      }
    }
  }

  if (totalHours > rule.maxHours + 0.0001) {
    errors.push(
      `A soma dos blocos não pode ultrapassar ${rule.maxHours} horas para esse tipo de escala.`,
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
    const rawAmount = workedHours * (rule.totalAmount / rule.maxHours);

    return {
      ...block,
      workedHours,
      hourlyRateCalculated: proportionalHourlyRate,
      amount: roundCurrency(rawAmount),
    };
  });

  const totalHours = roundCurrency(blocks.reduce((sum, block) => sum + block.workedHours, 0));
  const totalAmount = roundCurrency(blocks.reduce((sum, block) => sum + block.amount, 0));

  return {
    dayType,
    weekday,
    maxHours: rule.maxHours,
    proportionalHourlyRate,
    totalHours,
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
