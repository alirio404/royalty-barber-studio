export type AppointmentStatus =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'NO_ASISTIO';
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[];
export function parseTimeToMinutes(value: string): number;
export function overlaps(startA: number, endA: number, startB: number, endB: number): boolean;
export function slotIsWithinHours(slotStart: number, durationMinutes: number, opensAt: string, closesAt: string): boolean;
