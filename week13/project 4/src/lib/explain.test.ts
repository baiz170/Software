import { describe, expect, it } from "vitest";
import { explainAvailability } from "@/lib/explain";
import type { ExplainInternal } from "@/lib/explain";
import type { AvailabilityResult } from "@/lib/availability";

const ROOM = "Room B-204";

function sentenceCount(text: string): number {
  const matches = text.trim().match(/[.!?]+/g);
  return matches ? matches.length : 0;
}

describe("explainAvailability", () => {
  it("explains an available result in at most 2 sentences", () => {
    const result: AvailabilityResult = { available: true };
    const out = explainAvailability(result, { roomName: ROOM });

    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.text.length).toBeGreaterThan(0);
      expect(sentenceCount(out.text)).toBeLessThanOrEqual(2);
      expect(out.text).toContain(ROOM);
    }
  });

  it("explains a start-after-end rejection (AC1)", () => {
    const out = explainAvailability(
      { available: false, reason: "Start time must be earlier than end time." },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentenceCount(out.text)).toBeLessThanOrEqual(2);
      expect(out.text).toMatch(/end time|start time/i);
    }
  });

  it("explains a past-start-time rejection (AC2)", () => {
    const out = explainAvailability(
      {
        available: false,
        reason: "Start time must be strictly later than the current time (09:00).",
      },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/already passed|current time/i);
  });

  it("explains a duration-limit rejection (AC3)", () => {
    const out = explainAvailability(
      {
        available: false,
        reason: "Requested duration is 121 minutes, which exceeds the 120-minute maximum.",
      },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/2-hour|120/i);
  });

  it("explains a blocked-room rejection (AC4)", () => {
    const out = explainAvailability(
      { available: false, reason: "Room B-204 is currently blocked and cannot be reserved." },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/unavailable|blocked/i);
  });

  it("explains an overlap rejection (AC5)", () => {
    const out = explainAvailability(
      {
        available: false,
        reason:
          'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
      },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/another class|overlap|existing/i);
  });

  it("explains a malformed-input rejection", () => {
    const out = explainAvailability(
      { available: false, reason: "Please enter valid times in HH:MM format." },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/format|fields/i);
  });

  it("explains an out-of-range rejection", () => {
    const out = explainAvailability(
      { available: false, reason: "Times must be within the same day (00:00 to 24:00)." },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/same day|within/i);
  });

  it("explains a non-integer rejection", () => {
    const out = explainAvailability(
      { available: false, reason: "Start and end must be whole minutes after midnight." },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toMatch(/time values|re-enter/i);
  });

  it("falls back to a generic explanation for unknown reasons", () => {
    const out = explainAvailability(
      { available: false, reason: "Something unprecedented happened." },
      { roomName: ROOM },
    );

    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentenceCount(out.text)).toBeLessThanOrEqual(2);
      expect(out.text.length).toBeGreaterThan(0);
    }
  });

  it("uses the provided room name in the explanation", () => {
    const out = explainAvailability({ available: true }, { roomName: "Lab C-101" });

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toContain("Lab C-101");
  });

  it("falls back to a default room name when none is provided", () => {
    const out = explainAvailability({ available: true });

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toContain("This room");
  });

  it("falls back to a default room name when an empty string is provided", () => {
    const out = explainAvailability({ available: true }, { roomName: "   " });

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toContain("This room");
  });

  it("rejects null input", () => {
    const out = explainAvailability(null);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeTruthy();
  });

  it("rejects undefined input", () => {
    const out = explainAvailability(undefined);
    expect(out.ok).toBe(false);
  });

  it("rejects a plain string input", () => {
    const out = explainAvailability("available");
    expect(out.ok).toBe(false);
  });

  it("rejects an object with available=false but no reason", () => {
    const out = explainAvailability({ available: false });
    expect(out.ok).toBe(false);
  });

  it("rejects an object with a non-boolean available field", () => {
    const out = explainAvailability({ available: "yes", reason: "ok" });
    expect(out.ok).toBe(false);
  });

  it("produces at most 2 sentences for every rejection category", () => {
    const reasons: AvailabilityResult[] = [
      { available: false, reason: "Start time must be earlier than end time." },
      {
        available: false,
        reason: "Start time must be strictly later than the current time (09:00).",
      },
      {
        available: false,
        reason: "Requested duration is 121 minutes, which exceeds the 120-minute maximum.",
      },
      { available: false, reason: "Room B-204 is currently blocked and cannot be reserved." },
      {
        available: false,
        reason:
          'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
      },
      { available: false, reason: "Please enter valid times in HH:MM format." },
      { available: false, reason: "Times must be within the same day (00:00 to 24:00)." },
      {
        available: false,
        reason: "Start and end must be whole minutes after midnight.",
      },
    ];

    for (const result of reasons) {
      const out = explainAvailability(result, { roomName: ROOM });
      expect(out.ok).toBe(true);
      if (out.ok) {
        expect(sentenceCount(out.text)).toBeLessThanOrEqual(2);
      }
    }
  });

  it("regression F1: stale explanation — same result always yields identical text", () => {
    const result: AvailabilityResult = {
      available: false,
      reason: "Room B-204 is currently blocked and cannot be reserved.",
    };

    const a = explainAvailability(result, { roomName: ROOM });
    const b = explainAvailability(result, { roomName: ROOM });

    expect(a).toEqual(b);
  });

  it("regression F1: different results produce different explanations", () => {
    const blocked: AvailabilityResult = {
      available: false,
      reason: "Room B-204 is currently blocked and cannot be reserved.",
    };
    const overlap: AvailabilityResult = {
      available: false,
      reason:
        'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
    };

    const a = explainAvailability(blocked, { roomName: ROOM });
    const b = explainAvailability(overlap, { roomName: ROOM });

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.text).not.toEqual(b.text);
    }
  });

  it("regression F2: toggling — re-invoking with explanation already shown should be a no-op in pure logic", () => {
    const result: AvailabilityResult = { available: true };
    const first = explainAvailability(result, { roomName: ROOM });
    const second = explainAvailability(result, { roomName: ROOM });

    expect(first).toEqual(second);
    if (first.ok) {
      expect(first.text).toMatch(/free|clear/i);
    }
  });

  it("regression R1: rejects an adapter output exceeding the length cap", () => {
    const longText: ExplainInternal = {
      build: () => "A".repeat(400) + ".",
    };

    const out = explainAvailability(
      { available: true },
      { roomName: ROOM },
      longText,
    );

    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/validation/i);
  });

  it("regression R1: accepts an adapter output within the length cap", () => {
    const shortText: ExplainInternal = {
      build: () => "This room is free. You can use it.",
    };

    const out = explainAvailability(
      { available: true },
      { roomName: ROOM },
      shortText,
    );

    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toBe("This room is free. You can use it.");
  });

  it("regression R5: generic fallback for an unknown reason is accurate and non-misleading", () => {
    const result: AvailabilityResult = {
      available: false,
      reason: "Something unprecedented and unmapped happened.",
    };

    const out = explainAvailability(result, { roomName: ROOM });

    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(sentenceCount(out.text)).toBeLessThanOrEqual(2);
      expect(out.text).not.toMatch(/\bis available\b|are available\b|now available\b/i);
      expect(out.text).toMatch(/isn.t available|not available|check the reason/i);
    }
  });
});
