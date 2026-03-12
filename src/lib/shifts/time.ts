const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToHours(minutes: number) {
  return minutes / 60;
}

export function normalizeInterval(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

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

export function intervalsOverlap(
  first: { startTime: string; endTime: string },
  second: { startTime: string; endTime: string },
) {
  const a = normalizeInterval(first.startTime, first.endTime);
  const b = normalizeInterval(second.startTime, second.endTime);

  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}
