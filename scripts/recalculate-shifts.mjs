import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sundayHourValueOverride = parseNumberArg("--sunday-hour-value");

loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, ".env"));

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

assertFirebaseConfig(firebaseConfig);

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const SETTINGS_DOC_ID = "main";
const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const defaultSettings = {
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

const settingsSnapshot = await getDocs(query(collection(db, "settings")));
const settingsDoc = settingsSnapshot.docs.find((item) => item.id === SETTINGS_DOC_ID);
const rawSettings = settingsDoc?.data() ?? {};
const settings = normalizeSettings(rawSettings);

await setDoc(
  doc(db, "settings", SETTINGS_DOC_ID),
  {
    ...settings,
    updatedAt: new Date().toISOString(),
  },
  { merge: true },
);

const [shiftsSnapshot, blocksSnapshot] = await Promise.all([
  getDocs(query(collection(db, "shifts"))),
  getDocs(query(collection(db, "shiftBlocks"))),
]);

const blocksByShiftId = new Map();
for (const blockDoc of blocksSnapshot.docs) {
  const block = { id: blockDoc.id, ...blockDoc.data() };
  const current = blocksByShiftId.get(block.shiftId) ?? [];
  current.push(block);
  blocksByShiftId.set(block.shiftId, current);
}

let batch = writeBatch(db);
let operationsInBatch = 0;
let recalculatedShifts = 0;
let recalculatedBlocks = 0;

for (const shiftDoc of shiftsSnapshot.docs) {
  const shift = { id: shiftDoc.id, ...shiftDoc.data() };
  const blocks = (blocksByShiftId.get(shift.id) ?? []).sort(
    (current, next) => (current.sortOrder ?? 0) - (next.sortOrder ?? 0),
  );

  const dayType = getDayTypeFromDate(shift.date);
  const weekday = getWeekdayLabel(shift.date);
  const rule = getShiftRule(dayType, settings);
  const proportionalHourlyRate = roundCurrency(rule.totalAmount / rule.maxHours);

  let totalHours = 0;
  let totalAmount = 0;

  batch.set(
    doc(db, "shifts", shift.id),
    {
      dayType,
      weekday,
      totalHours: 0,
      totalAmount: 0,
      isSplit: blocks.length > 1,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  operationsInBatch += 1;

  for (const block of blocks) {
    const workedHours = roundCurrency(calculateWorkedHours(block.startTime, block.endTime));
    const calculatedAmount = roundCurrency(workedHours * proportionalHourlyRate);
    const hasManualAmount =
      block.isAmountManual === true &&
      block.manualAmount !== null &&
      block.manualAmount !== undefined;
    const amount = hasManualAmount ? roundCurrency(Number(block.manualAmount)) : calculatedAmount;

    totalHours += workedHours;
    totalAmount += amount;

    batch.set(
      doc(db, "shiftBlocks", block.id),
      {
        dayType,
        weekday,
        workedHours,
        hourlyRateCalculated: proportionalHourlyRate,
        calculatedAmount,
        amount,
      },
      { merge: true },
    );
    operationsInBatch += 1;
    recalculatedBlocks += 1;

    if (operationsInBatch >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      operationsInBatch = 0;
    }
  }

  batch.set(
    doc(db, "shifts", shift.id),
    {
      totalHours: roundCurrency(totalHours),
      totalAmount: roundCurrency(totalAmount),
    },
    { merge: true },
  );
  operationsInBatch += 1;
  recalculatedShifts += 1;

  if (operationsInBatch >= 400) {
    await batch.commit();
    batch = writeBatch(db);
    operationsInBatch = 0;
  }
}

if (operationsInBatch > 0) {
  await batch.commit();
}

console.log(
  JSON.stringify(
    {
      settings,
      recalculatedShifts,
      recalculatedBlocks,
    },
    null,
    2,
  ),
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function assertFirebaseConfig(config) {
  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(`Variável Firebase ausente: ${key}`);
    }
  }
}

function normalizeSettings(rawSettings) {
  return {
    ...defaultSettings,
    ...rawSettings,
    mondayToThursdayHourValue:
      rawSettings.mondayToThursdayHourValue ??
      rawSettings.sundayToThursdayHourValue ??
      defaultSettings.mondayToThursdayHourValue,
    mondayToThursdayBonus:
      rawSettings.mondayToThursdayBonus ??
      rawSettings.sundayToThursdayBonus ??
      defaultSettings.mondayToThursdayBonus,
    fridaySaturdayHourValue:
      rawSettings.fridaySaturdayHourValue ?? defaultSettings.fridaySaturdayHourValue,
    fridaySaturdayBonus:
      rawSettings.fridaySaturdayBonus ?? defaultSettings.fridaySaturdayBonus,
    sundayHourValue:
      sundayHourValueOverride ??
      rawSettings.sundayHourValue ??
      rawSettings.sundayToThursdayHourValue ??
      defaultSettings.sundayHourValue,
    sundayBonus:
      rawSettings.sundayBonus ??
      rawSettings.sundayToThursdayBonus ??
      defaultSettings.sundayBonus,
    defaultStartTimeMondayToThursday:
      rawSettings.defaultStartTimeMondayToThursday ??
      rawSettings.defaultStartTimeWeek ??
      defaultSettings.defaultStartTimeMondayToThursday,
    defaultEndTimeMondayToThursday:
      rawSettings.defaultEndTimeMondayToThursday ??
      rawSettings.defaultEndTimeWeek ??
      defaultSettings.defaultEndTimeMondayToThursday,
    defaultStartTimeFridaySaturday:
      rawSettings.defaultStartTimeFridaySaturday ??
      rawSettings.defaultStartTimeWeekend ??
      defaultSettings.defaultStartTimeFridaySaturday,
    defaultEndTimeFridaySaturday:
      rawSettings.defaultEndTimeFridaySaturday ??
      rawSettings.defaultEndTimeWeekend ??
      defaultSettings.defaultEndTimeFridaySaturday,
    defaultStartTimeSunday:
      rawSettings.defaultStartTimeSunday ??
      rawSettings.defaultStartTimeWeek ??
      defaultSettings.defaultStartTimeSunday,
    defaultEndTimeSunday:
      rawSettings.defaultEndTimeSunday ??
      rawSettings.defaultEndTimeWeek ??
      defaultSettings.defaultEndTimeSunday,
  };
}

function parseNumberArg(flag) {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (!match) {
    return undefined;
  }

  const value = Number(match.slice(flag.length + 1));
  if (Number.isNaN(value)) {
    throw new Error(`Valor inválido para ${flag}`);
  }

  return value;
}

function getWeekdayLabel(date) {
  return WEEKDAY_LABELS[new Date(`${date}T12:00:00`).getDay()];
}

function getDayTypeFromDate(date) {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) {
    return "SUNDAY";
  }
  if (day === 5 || day === 6) {
    return "FRIDAY_SATURDAY";
  }
  return "MONDAY_TO_THURSDAY";
}

function getShiftRule(dayType, settings) {
  if (dayType === "SUNDAY") {
    const maxHours = calculateWorkedHours(
      settings.defaultStartTimeSunday,
      settings.defaultEndTimeSunday,
    );

    return {
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
      maxHours,
      totalAmount: roundCurrency(
        settings.fridaySaturdayHourValue * maxHours + settings.fridaySaturdayBonus,
      ),
    };
  }

  const maxHours = calculateWorkedHours(
    settings.defaultStartTimeMondayToThursday,
    settings.defaultEndTimeMondayToThursday,
  );

  return {
    maxHours,
    totalAmount: roundCurrency(
      settings.mondayToThursdayHourValue * maxHours + settings.mondayToThursdayBonus,
    ),
  };
}

function calculateWorkedHours(startTime, endTime) {
  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return roundCurrency((endMinutes - startMinutes) / 60);
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
