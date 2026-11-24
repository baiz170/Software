export interface Booking {
  start: number;
  end: number;
  label: string;
}

export interface AvailabilityRequest {
  start: number;
  end: number;
}

export interface RoomSchedule {
  roomName: string;
  bookings: readonly Booking[];
  currentTime: number;
}

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string };

export const MAX_DURATION = 120;
export const MINUTES_PER_DAY = 1440;

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function checkAvailability(
  req: AvailabilityRequest,
  blocked: boolean,
  schedule: RoomSchedule,
): AvailabilityResult {
  const { start, end } = req;
  const { roomName, bookings, currentTime } = schedule;

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return {
      available: false,
      reason: "Start and end must be whole minutes after midnight.",
    };
  }

  if (start < 0 || end > MINUTES_PER_DAY) {
    return {
      available: false,
      reason: "Times must be within the same day (00:00 to 24:00).",
    };
  }

  if (start >= end) {
    return {
      available: false,
      reason: "Start time must be earlier than end time.",
    };
  }

  if (start <= currentTime) {
    return {
      available: false,
      reason: `Start time must be strictly later than the current time (${formatTime(currentTime)}).`,
    };
  }

  const duration = end - start;
  if (duration > MAX_DURATION) {
    return {
      available: false,
      reason: `Requested duration is ${duration} minutes, which exceeds the ${MAX_DURATION}-minute maximum.`,
    };
  }

  if (blocked) {
    return {
      available: false,
      reason: `${roomName} is currently blocked and cannot be reserved.`,
    };
  }

  for (const booking of bookings) {
    if (start < booking.end && end > booking.start) {
      return {
        available: false,
        reason: `Overlaps with existing booking "${booking.label}" (${formatTime(booking.start)}–${formatTime(booking.end)}).`,
      };
    }
  }

  return { available: true };
}
