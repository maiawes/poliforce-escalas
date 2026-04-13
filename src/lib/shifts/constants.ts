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
  mondayToThursdayHourValue: 40,
  mondayToThursdayBonus: 30,
  fridaySaturdayHourValue: 45,
  fridaySaturdayBonus: 30,
  sundayHourValue: 40,
  sundayBonus: 30,
  defaultStartTimeMondayToThursday: "20:00",
  defaultEndTimeMondayToThursday: "03:00",
  defaultStartTimeFridaySaturday: "20:00",
  defaultEndTimeFridaySaturday: "06:00",
  defaultStartTimeSunday: "20:00",
  defaultEndTimeSunday: "03:00",
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
  MONDAY_TO_THURSDAY: "Segunda a quinta",
  FRIDAY_SATURDAY: "Sexta e sábado",
  SUNDAY: "Domingo",
} as const;
