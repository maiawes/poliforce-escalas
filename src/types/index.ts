export type DayType = "SUNDAY_TO_THURSDAY" | "FRIDAY_SATURDAY";

export type ShiftFormMode = "simple" | "split";

export type Agent = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Settings = {
  id: string;
  sundayToThursdayHourValue: number;
  sundayToThursdayBonus: number;
  fridaySaturdayHourValue: number;
  fridaySaturdayBonus: number;
  defaultStartTimeWeek: string;
  defaultEndTimeWeek: string;
  defaultStartTimeWeekend: string;
  defaultEndTimeWeekend: string;
  updatedAt?: string;
};

export type Shift = {
  id: string;
  date: string;
  monthKey: string;
  dayType: DayType;
  weekday: string;
  notes: string;
  totalHours: number;
  totalAmount: number;
  isSplit: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ShiftBlock = {
  id: string;
  shiftId: string;
  shiftDate: string;
  monthKey: string;
  weekday: string;
  dayType: DayType;
  agentId: string;
  agentName: string;
  startTime: string;
  endTime: string;
  workedHours: number;
  hourlyRateCalculated: number;
  calculatedAmount?: number;
  manualAmount?: number | null;
  isAmountManual?: boolean;
  amount: number;
  sortOrder: number;
};

export type ShiftWithBlocks = Shift & {
  blocks: ShiftBlock[];
};

export type ShiftBlockDraft = {
  agentId: string;
  agentName: string;
  startTime: string;
  endTime: string;
  manualAmount?: string;
};

export type ShiftDraft = {
  date: string;
  notes: string;
  blocks: ShiftBlockDraft[];
};

export type ShiftCalculationBlock = Omit<ShiftBlockDraft, "manualAmount"> & {
  workedHours: number;
  calculatedAmount: number;
  amount: number;
  hourlyRateCalculated: number;
  manualAmount?: number | null;
  isAmountManual: boolean;
};

export type ShiftCalculation = {
  dayType: DayType;
  weekday: string;
  maxHours: number;
  proportionalHourlyRate: number;
  totalHours: number;
  coveredHours: number;
  overlapHours: number;
  totalAmount: number;
  isSplit: boolean;
  blocks: ShiftCalculationBlock[];
};

export type DashboardAgentSummary = {
  agentId: string;
  agentName: string;
  totalAmount: number;
  totalHours: number;
  totalShifts: number;
  averagePerShift: number;
};

export type DashboardSummary = {
  monthKey: string;
  totalPaid: number;
  totalShifts: number;
  splitShifts: number;
  totalHours: number;
  perAgent: DashboardAgentSummary[];
  totalAgentsWithWork: number;
};

export type ConsolidatedMatrixRow = {
  agentId: string;
  agentName: string;
  dailyValues: Record<string, number>;
  totalAmount: number;
};

export type ExportRow = {
  data: string;
  dia: string;
  tipo: string;
  agentes: string;
  horas: string;
  valor: number;
  observacoes: string;
};
