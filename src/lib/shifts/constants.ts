import { Agent, Settings } from "@/types";

export const SETTINGS_DOC_ID = "main";

export const INITIAL_AGENTS: Agent[] = [
  { id: "maia", name: "Maia", active: true },
  { id: "chico", name: "Chico", active: true },
  { id: "francisco", name: "Francisco", active: true },
  { id: "r-souza", name: "R Souza", active: true },
  { id: "tessaro", name: "Tessaro", active: true },
];

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_DOC_ID,
  sundayToThursdayHourValue: 40,
  sundayToThursdayBonus: 30,
  fridaySaturdayHourValue: 45,
  fridaySaturdayBonus: 30,
  defaultStartTimeWeek: "20:00",
  defaultEndTimeWeek: "03:00",
  defaultStartTimeWeekend: "20:00",
  defaultEndTimeWeekend: "06:00",
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const DAY_TYPE_LABELS = {
  SUNDAY_TO_THURSDAY: "Domingo a quinta",
  FRIDAY_SATURDAY: "Sexta ou sábado",
} as const;
