import type { AvailabilityResult } from "@/lib/availability";

export interface ExplainOptions {
  roomName?: string;
}

export type ExplainResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const MAX_SENTENCES = 2;
const MAX_TEXT_LENGTH = 300;

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[.!?]+/g);
  return matches ? matches.length : 1;
}

function isAvailabilityResult(value: unknown): value is AvailabilityResult {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.available !== true && obj.available !== false) return false;
  if (obj.available === true) return true;
  return typeof obj.reason === "string" && obj.reason.length > 0;
}

function buildExplanation(result: AvailabilityResult, roomName: string): string {
  if (result.available) {
    return `Great news — ${roomName} is free for your chosen time slot. No existing bookings overlap, so you're clear to use the room.`;
  }

  const reason = result.reason;

  if (reason.includes("Start time must be earlier")) {
    return `Your end time needs to come after your start time. Double-check both fields and try again.`;
  }

  if (reason.includes("Start time must be strictly later")) {
    return `You can't book a time that has already passed. Pick a start time after the current time shown above.`;
  }

  if (reason.includes("exceeds the") && reason.includes("maximum")) {
    return `Your requested slot is longer than the 2-hour limit. Shorten the end time so the total stays within 120 minutes.`;
  }

  if (reason.includes("blocked")) {
    return `${roomName} is temporarily unavailable for bookings. Check back later or choose a different room.`;
  }

  if (reason.includes("Overlaps with existing booking")) {
    return `Another class is already using ${roomName} during part of your requested time. Try a slot that starts after that booking ends or ends before it begins.`;
  }

  if (reason.includes("valid times") || reason.includes("HH:MM")) {
    return `Both time fields need to be filled in correctly. Use the HH:MM format, like 14:30.`;
  }

  if (reason.includes("within the same day")) {
    return `Your times need to fall within the same day (00:00 to 24:00). Adjust them and try again.`;
  }

  if (reason.includes("whole minutes")) {
    return `Something went wrong with the time values. Please re-enter the start and end times and try again.`;
  }

  return `The room isn't available for your requested time. Check the reason above and adjust your times.`;
}

export interface ExplainInternal {
  build: (result: AvailabilityResult, roomName: string) => string;
}

const defaultInternal: ExplainInternal = { build: buildExplanation };

export function explainAvailability(
  result: unknown,
  options: ExplainOptions = {},
  internal: ExplainInternal = defaultInternal,
): ExplainResult {
  if (!isAvailabilityResult(result)) {
    return { ok: false, error: "Cannot explain an invalid availability result." };
  }

  const roomName =
    typeof options.roomName === "string" && options.roomName.trim()
      ? options.roomName.trim()
      : "This room";

  try {
    const text = internal.build(result as AvailabilityResult, roomName);

    if (!text || countSentences(text) > MAX_SENTENCES || text.length > MAX_TEXT_LENGTH) {
      return { ok: false, error: "Generated explanation failed validation." };
    }

    return { ok: true, text };
  } catch {
    return { ok: false, error: "An unexpected error occurred while generating the explanation." };
  }
}
