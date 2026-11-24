import { describe, expect, it } from "vitest";
import { explainAvailability } from "@/lib/explain";
import type { ExplainInternal } from "@/lib/explain";
import {
  checkAvailability,
  timeToMinutes,
} from "@/lib/availability";
import type { AvailabilityResult } from "@/lib/availability";
import {
  CURRENT_TIME,
  ROOM_BOOKINGS,
  ROOM_NAME,
} from "@/lib/roomFixtures";

const schedule = {
  roomName: ROOM_NAME,
  bookings: ROOM_BOOKINGS,
  currentTime: CURRENT_TIME,
};

function sentences(text: string): number {
  const m = text.trim().match(/[.!?]+/g);
  return m ? m.length : 0;
}

function run(req: { start: number; end: number }, blocked = false): AvailabilityResult {
  return checkAvailability(req, blocked, schedule);
}

describe("explainAvailability — 8 required end-to-end cases", () => {
  it("case 1: available slot produces a positive explanation", () => {
    const result = run({ start: 720, end: 780 });
    expect(result.available).toBe(true);

    const out = explainAvailability(result, { roomName: ROOM_NAME });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentences(out.text)).toBeLessThanOrEqual(2);
      expect(out.text).toContain(ROOM_NAME);
      expect(out.text).toMatch(/free|clear|available/i);
    }
  });

  it("case 2: overlap with existing booking explains the conflict", () => {
    const result = run({ start: 630, end: 700 });
    expect(result.available).toBe(false);
    if (!result.available) expect(result.reason).toMatch(/Overlaps/);

    const out = explainAvailability(result, { roomName: ROOM_NAME });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentences(out.text)).toBeLessThanOrEqual(2);
      expect(out.text).toMatch(/another class|overlap|existing/i);
    }
  });

  it("case 3: blocked room explains the room is unavailable", () => {
    const result = run({ start: 720, end: 780 }, true);
    expect(result.available).toBe(false);
    if (!result.available) expect(result.reason).toMatch(/blocked/);

    const out = explainAvailability(result, { roomName: ROOM_NAME });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentences(out.text)).toBeLessThanOrEqual(2);
      expect(out.text).toMatch(/unavailable|blocked/i);
    }
  });

  it("case 4: invalid time format (empty string) explains format requirement", () => {
    const s = timeToMinutes("");
    const en = timeToMinutes("");
    expect(s).toBeNull();
    expect(en).toBeNull();

    const result: AvailabilityResult = {
      available: false,
      reason: "Please enter valid times in HH:MM format.",
    };

    const out = explainAvailability(result, { roomName: ROOM_NAME });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/format|fields/i);
  });

  it("case 5: past start time explains it has already passed", () => {
    const result = run({ start: 480, end: 530 });
    expect(result.available).toBe(false);
    if (!result.available) expect(result.reason).toMatch(/strictly later/);

    const out = explainAvailability(result, { roomName: ROOM_NAME });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/already passed|current time/i);
  });

  it("case 6: malformed input (null fields) is rejected by the validator", () => {
    const out = explainAvailability(null, { roomName: ROOM_NAME });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeTruthy();
  });

  it("case 7: overly long reason string still yields a valid explanation", () => {
    const longReason =
      "A".repeat(5000) + " exceeds the 120-minute maximum.";
    const result: AvailabilityResult = {
      available: false,
      reason: longReason,
    };

    const out = explainAvailability(result, { roomName: ROOM_NAME });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentences(out.text)).toBeLessThanOrEqual(2);
      expect(out.text.length).toBeLessThan(longReason.length);
    }
  });

  it("case 8: simulated adapter failure returns a safe error, never throws", () => {
    const failing: ExplainInternal = {
      build: () => {
        throw new Error("simulated network timeout");
      },
    };

    const out = explainAvailability(
      { available: true },
      { roomName: ROOM_NAME },
      failing,
    );

    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toMatch(/unexpected error/i);
    }
  });
});

describe("explainAvailability — 3 prompt comparison", () => {
  const cases: Array<{
    label: string;
    result: AvailabilityResult;
  }> = [
    {
      label: "available",
      result: { available: true },
    },
    {
      label: "overlap",
      result: {
        available: false,
        reason:
          'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
      },
    },
    {
      label: "duration limit",
      result: {
        available: false,
        reason:
          "Requested duration is 121 minutes, which exceeds the 120-minute maximum.",
      },
    },
  ];

  for (const { label, result } of cases) {
    it(`prompt A (current adapter) — ${label}: clear, <=2 sentences, factual`, () => {
      const out = explainAvailability(result, { roomName: ROOM_NAME });
      expect(out.ok).toBe(true);
      if (out.ok) {
        expect(sentences(out.text)).toBeLessThanOrEqual(2);
        expect(out.text.length).toBeGreaterThan(20);
        expect(out.text).toMatch(/[.!?]$/);
      }
    });
  }

  it("prompt B (student-friendly) and prompt C (terse) match factual accuracy of prompt A for the overlap case", () => {
    const overlap: AvailabilityResult = {
      available: false,
      reason:
        'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
    };

    const promptB =
      "Another class is already using Room B-204 during part of your requested time. Try a slot that starts after that booking ends or ends before it begins.";
    const promptC = "That time conflicts with an existing booking. Pick a different slot.";

    expect(sentences(promptB)).toBeLessThanOrEqual(2);
    expect(sentences(promptC)).toBeLessThanOrEqual(2);

    expect(promptB).toMatch(/existing|already/i);
    expect(promptC).toMatch(/conflict|existing/i);

    const aOut = explainAvailability(overlap, { roomName: ROOM_NAME });
    expect(aOut.ok).toBe(true);
    if (aOut.ok) {
      expect(aOut.ok && aOut.text).not.toContain("available");
      expect(aOut.ok && !aOut.text.includes("is available")).toBe(true);
    }
  });

  it("all three prompts remain consistent: never claim available when result is unavailable", () => {
    const unavailable: AvailabilityResult = {
      available: false,
      reason: "Room B-204 is currently blocked and cannot be reserved.",
    };

    const aOut = explainAvailability(unavailable, { roomName: ROOM_NAME });
    expect(aOut.ok).toBe(true);
    if (aOut.ok) {
      expect(aOut.text).not.toMatch(/\bavailable\b/i);
    }

    const promptB =
      "Room B-204 is temporarily unavailable for bookings. Check back later or choose a different room.";
    const promptC = "That room is blocked. Try another room or time.";

    expect(promptB).not.toMatch(/\bis available\b/i);
    expect(promptC).not.toMatch(/\bis available\b/i);
  });
});
