"use client";

import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./client";
import {
  Agent,
  Settings,
  ShiftDraft,
  ShiftWithBlocks,
} from "@/types";
import { DEFAULT_SETTINGS, INITIAL_AGENTS, SETTINGS_DOC_ID } from "@/lib/shifts/constants";
import {
  calculateShift,
  createEmptyBlock,
  getMonthKeyFromDate,
  validateShiftDraft,
} from "@/lib/shifts/calculations";

export const agentsCollection = collection(db, "agents");
export const shiftsCollection = collection(db, "shifts");
export const shiftBlocksCollection = collection(db, "shiftBlocks");
export const settingsCollection = collection(db, "settings");

function withId<T>(id: string, data: Record<string, unknown>) {
  return { id, ...(data as T) };
}

export async function ensureSeedData() {
  const [agentsCount, settingsCount] = await Promise.all([
    getCountFromServer(agentsCollection),
    getCountFromServer(settingsCollection),
  ]);

  const batch = writeBatch(db);

  if (agentsCount.data().count === 0) {
    INITIAL_AGENTS.forEach((agent) => {
      batch.set(doc(db, "agents", agent.id), {
        name: agent.name,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  if (settingsCount.data().count === 0) {
    batch.set(doc(db, "settings", SETTINGS_DOC_ID), {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
}

export function subscribeToAgents(callback: (items: Agent[]) => void) {
  return onSnapshot(query(agentsCollection, orderBy("name", "asc")), (snapshot) => {
    callback(snapshot.docs.map((item) => withId<Agent>(item.id, item.data())));
  });
}

export function subscribeToSettings(callback: (settings: Settings) => void) {
  return onSnapshot(doc(db, "settings", SETTINGS_DOC_ID), (snapshot) => {
    const data = snapshot.data();
    const rawSettings = data as
      | (Partial<Settings> & {
          sundayToThursdayHourValue?: number;
          sundayToThursdayBonus?: number;
          defaultStartTimeWeek?: string;
          defaultEndTimeWeek?: string;
          defaultStartTimeWeekend?: string;
          defaultEndTimeWeekend?: string;
        })
      | undefined;

    callback({
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      mondayToThursdayHourValue:
        rawSettings?.mondayToThursdayHourValue ??
        rawSettings?.sundayToThursdayHourValue ??
        DEFAULT_SETTINGS.mondayToThursdayHourValue,
      mondayToThursdayBonus:
        rawSettings?.mondayToThursdayBonus ??
        rawSettings?.sundayToThursdayBonus ??
        DEFAULT_SETTINGS.mondayToThursdayBonus,
      sundayHourValue:
        rawSettings?.sundayHourValue ??
        rawSettings?.sundayToThursdayHourValue ??
        DEFAULT_SETTINGS.sundayHourValue,
      sundayBonus:
        rawSettings?.sundayBonus ??
        rawSettings?.sundayToThursdayBonus ??
        DEFAULT_SETTINGS.sundayBonus,
      defaultStartTimeMondayToThursday:
        rawSettings?.defaultStartTimeMondayToThursday ??
        rawSettings?.defaultStartTimeWeek ??
        DEFAULT_SETTINGS.defaultStartTimeMondayToThursday,
      defaultEndTimeMondayToThursday:
        rawSettings?.defaultEndTimeMondayToThursday ??
        rawSettings?.defaultEndTimeWeek ??
        DEFAULT_SETTINGS.defaultEndTimeMondayToThursday,
      defaultStartTimeFridaySaturday:
        rawSettings?.defaultStartTimeFridaySaturday ??
        rawSettings?.defaultStartTimeWeekend ??
        DEFAULT_SETTINGS.defaultStartTimeFridaySaturday,
      defaultEndTimeFridaySaturday:
        rawSettings?.defaultEndTimeFridaySaturday ??
        rawSettings?.defaultEndTimeWeekend ??
        DEFAULT_SETTINGS.defaultEndTimeFridaySaturday,
      defaultStartTimeSunday:
        rawSettings?.defaultStartTimeSunday ??
        rawSettings?.defaultStartTimeWeek ??
        DEFAULT_SETTINGS.defaultStartTimeSunday,
      defaultEndTimeSunday:
        rawSettings?.defaultEndTimeSunday ??
        rawSettings?.defaultEndTimeWeek ??
        DEFAULT_SETTINGS.defaultEndTimeSunday,
      id: SETTINGS_DOC_ID,
    });
  });
}

export function subscribeToMonthlyShifts(
  monthKey: string,
  callback: (items: Omit<ShiftWithBlocks, "blocks">[]) => void,
) {
  return onSnapshot(
    query(shiftsCollection, where("monthKey", "==", monthKey)),
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => withId<Omit<ShiftWithBlocks, "blocks">>(item.id, item.data()))
          .sort((current, next) => current.date.localeCompare(next.date)),
      );
    },
  );
}

export function subscribeToMonthlyShiftBlocks(monthKey: string, callback: (items: ShiftWithBlocks["blocks"]) => void) {
  return onSnapshot(
    query(shiftBlocksCollection, where("monthKey", "==", monthKey)),
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => withId<ShiftWithBlocks["blocks"][number]>(item.id, item.data()))
          .sort((current, next) =>
            current.shiftDate === next.shiftDate
              ? current.sortOrder - next.sortOrder
              : current.shiftDate.localeCompare(next.shiftDate),
          ),
      );
    },
  );
}

export function subscribeToShiftById(
  shiftId: string,
  callback: (shift: Omit<ShiftWithBlocks, "blocks"> | null) => void,
) {
  return onSnapshot(doc(db, "shifts", shiftId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(withId<Omit<ShiftWithBlocks, "blocks">>(snapshot.id, snapshot.data()));
  });
}

export function subscribeToShiftBlocksByShiftId(
  shiftId: string,
  callback: (blocks: ShiftWithBlocks["blocks"]) => void,
) {
  return onSnapshot(
    query(shiftBlocksCollection, where("shiftId", "==", shiftId)),
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => withId<ShiftWithBlocks["blocks"][number]>(item.id, item.data()))
          .sort((current, next) => current.sortOrder - next.sortOrder),
      );
    },
  );
}

export async function saveAgent(agent: Pick<Agent, "id" | "name" | "active">) {
  const reference = doc(db, "agents", agent.id);
  await setDoc(
    reference,
    {
      name: agent.name,
      active: agent.active,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function updateSettings(values: Settings) {
  await setDoc(
    doc(db, "settings", SETTINGS_DOC_ID),
    {
      ...values,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function saveShift(draft: ShiftDraft, settings: Settings, shiftId?: string) {
  const validation = validateShiftDraft(draft, settings);

  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "Escala inválida.");
  }

  const calculation = calculateShift(draft, settings);
  const monthKey = getMonthKeyFromDate(draft.date);
  const timestamp = new Date().toISOString();

  if (shiftId) {
    const batch = writeBatch(db);
    const shiftReference = doc(db, "shifts", shiftId);
    const existingBlocksQuery = query(shiftBlocksCollection, where("shiftId", "==", shiftId));

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(shiftReference);
      if (!snapshot.exists()) {
        throw new Error("Escala não encontrada.");
      }
    });

    const existingBlocks = await getDocs(existingBlocksQuery);

    existingBlocks.docs.forEach((block) => {
      batch.delete(doc(db, "shiftBlocks", block.id));
    });

    batch.update(shiftReference, {
      date: draft.date,
      monthKey,
      dayType: calculation.dayType,
      weekday: calculation.weekday,
      notes: draft.notes,
      totalHours: calculation.totalHours,
      totalAmount: calculation.totalAmount,
      isSplit: calculation.isSplit,
      updatedAt: timestamp,
    });

    calculation.blocks.forEach((block, index) => {
      const blockReference = doc(shiftBlocksCollection);
      batch.set(blockReference, {
        shiftId,
        shiftDate: draft.date,
        monthKey,
        weekday: calculation.weekday,
        dayType: calculation.dayType,
        agentId: block.agentId,
        agentName: block.agentName,
        startTime: block.startTime,
        endTime: block.endTime,
        workedHours: block.workedHours,
        hourlyRateCalculated: block.hourlyRateCalculated,
        calculatedAmount: block.calculatedAmount,
        manualAmount: block.manualAmount,
        isAmountManual: block.isAmountManual,
        amount: block.amount,
        sortOrder: index,
      });
    });

    await batch.commit();
    return shiftId;
  }

  const shiftReference = await addDoc(shiftsCollection, {
    date: draft.date,
    monthKey,
    dayType: calculation.dayType,
    weekday: calculation.weekday,
    notes: draft.notes,
    totalHours: calculation.totalHours,
    totalAmount: calculation.totalAmount,
    isSplit: calculation.isSplit,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const batch = writeBatch(db);

  calculation.blocks.forEach((block, index) => {
    const blockReference = doc(shiftBlocksCollection);
    batch.set(blockReference, {
      shiftId: shiftReference.id,
      shiftDate: draft.date,
      monthKey,
      weekday: calculation.weekday,
      dayType: calculation.dayType,
      agentId: block.agentId,
      agentName: block.agentName,
      startTime: block.startTime,
      endTime: block.endTime,
      workedHours: block.workedHours,
      hourlyRateCalculated: block.hourlyRateCalculated,
      calculatedAmount: block.calculatedAmount,
      manualAmount: block.manualAmount,
      isAmountManual: block.isAmountManual,
      amount: block.amount,
      sortOrder: index,
    });
  });

  await batch.commit();
  return shiftReference.id;
}

export async function deleteShift(shiftId: string) {
  const batch = writeBatch(db);
  const blocks = await getDocs(query(shiftBlocksCollection, where("shiftId", "==", shiftId)));

  blocks.docs.forEach((block) => batch.delete(doc(db, "shiftBlocks", block.id)));
  batch.delete(doc(db, "shifts", shiftId));

  await batch.commit();
}

export async function duplicateShift(shift: ShiftWithBlocks, newDate: string, settings: Settings) {
  const result = await saveShift(
    {
      date: newDate,
      notes: shift.notes,
      blocks: shift.blocks.map((block) => ({
        agentId: block.agentId,
        agentName: block.agentName,
        startTime: block.startTime,
        endTime: block.endTime,
        manualAmount:
          block.isAmountManual && typeof block.manualAmount === "number"
            ? block.manualAmount.toFixed(2)
            : "",
      })),
    },
    settings,
  );

  return result;
}

export function buildShiftDraftFromExisting(shift: ShiftWithBlocks): ShiftDraft {
  return {
    date: shift.date,
    notes: shift.notes,
    blocks:
      shift.blocks.length > 0
        ? shift.blocks.map((block) => ({
            agentId: block.agentId,
            agentName: block.agentName,
            startTime: block.startTime,
            endTime: block.endTime,
            manualAmount:
              block.isAmountManual && typeof block.manualAmount === "number"
                ? block.manualAmount.toFixed(2)
                : "",
          }))
        : [createEmptyBlock()],
  };
}
