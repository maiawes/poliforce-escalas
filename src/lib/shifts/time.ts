const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToHours(minutes: number) {
  return minutes / 60;
}

export function normalizeInterval(startTime: string, endTime: string) {
  return normalizeIntervalFromReference(startTime, endTime);
}

export function normalizeIntervalFromReference(
  startTime: string,
  endTime: string,
  referenceStartTime?: string,
) {
  const referenceMinutes =
    typeof referenceStartTime === "string" ? timeToMinutes(referenceStartTime) : null;

  let startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  if (referenceMinutes !== null) {
    if (startMinutes < referenceMinutes) {
      startMinutes += MINUTES_PER_DAY;
    }

    if (endMinutes < referenceMinutes) {
      endMinutes += MINUTES_PER_DAY;
    }
  }

  if (endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY;
  }

  return {
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
  };
}

export function calculateWorkedHours(startTime: string, endTime: string) {
  return minutesToHours(normalizeInterval(startTime, endTime).durationMinutes);
}

export function calculateCoveredHours(
  blocks: Array<{ startTime: string; endTime: string }>,
  referenceStartTime?: string,
) {
  if (blocks.length === 0) {
    return 0;
  }

  const intervals = blocks
    .map((block) => normalizeIntervalFromReference(block.startTime, block.endTime, referenceStartTime))
    .sort((current, next) => current.startMinutes - next.startMinutes);

  const merged = intervals.reduce<Array<{ startMinutes: number; endMinutes: number }>>(
    (accumulator, interval) => {
      const last = accumulator[accumulator.length - 1];

      if (!last || interval.startMinutes > last.endMinutes) {
        accumulator.push({
          startMinutes: interval.startMinutes,
          endMinutes: interval.endMinutes,
        });
        return accumulator;
      }

      last.endMinutes = Math.max(last.endMinutes, interval.endMinutes);
      return accumulator;
    },
    [],
  );

  const coveredMinutes = merged.reduce(
    (sum, interval) => sum + (interval.endMinutes - interval.startMinutes),
    0,
  );

  return minutesToHours(coveredMinutes);
}
