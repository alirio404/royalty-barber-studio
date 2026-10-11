export const ACTIVE_APPOINTMENT_STATUSES = ['SOLICITADA', 'CONFIRMADA', 'EN_PROCESO'];

export function parseTimeToMinutes(value) {
  const match = /^(?:([01]\d|2[0-3])):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
  if (!match) throw new Error(`Hora no válida: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function overlaps(startA, endA, startB, endB) {
  if (![startA, endA, startB, endB].every(Number.isFinite)) return true;
  if (startA >= endA || startB >= endB) return true;
  return startA < endB && startB < endA;
}

export function slotIsWithinHours(slotStart, durationMinutes, opensAt, closesAt) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) return false;
  const open = parseTimeToMinutes(opensAt);
  const close = parseTimeToMinutes(closesAt);
  return slotStart >= open && slotStart + durationMinutes <= close;
}
