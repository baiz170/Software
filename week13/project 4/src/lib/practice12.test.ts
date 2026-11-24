import { describe, expect, it } from "vitest";
import { checkAvailability } from "@/lib/availability";
import type { RoomSchedule } from "@/lib/availability";
import {
  CURRENT_TIME,
  ROOM_BOOKINGS,
  ROOM_NAME,
} from "@/lib/roomFixtures";

const schedule: RoomSchedule = {
  roomName: ROOM_NAME,
  bookings: ROOM_BOOKINGS,
  currentTime: CURRENT_TIME,
};

describe("Practice 12 — eight shared test cases (code-based)", () => {
  it("T1: valid future slot, 60 min, no overlap → Available", () => {
    expect(checkAvailability({ start: 720, end: 780 }, false, schedule)).toEqual({
      available: true,
    });
  });

  it("T2: requested slot overlaps existing booking → Unavailable", () => {
    expect(checkAvailability({ start: 630, end: 700 }, false, schedule)).toEqual({
      available: false,
      reason:
        'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
    });
  });

  it("T3: room is blocked → Unavailable", () => {
    expect(checkAvailability({ start: 720, end: 780 }, true, schedule)).toEqual({
      available: false,
      reason: "Room B-204 is currently blocked and cannot be reserved.",
    });
  });

  it("T4: duration is 0 → validation error", () => {
    expect(checkAvailability({ start: 720, end: 720 }, false, schedule)).toEqual({
      available: false,
      reason: "Start time must be earlier than end time.",
    });
  });

  it("T5: duration is 121 minutes → validation error", () => {
    expect(checkAvailability({ start: 720, end: 841 }, false, schedule)).toEqual({
      available: false,
      reason:
        "Requested duration is 121 minutes, which exceeds the 120-minute maximum.",
    });
  });

  it("T6: start time in the past → validation error", () => {
    expect(checkAvailability({ start: 480, end: 530 }, false, schedule)).toEqual({
      available: false,
      reason: "Start time must be strictly later than the current time (09:00).",
    });
  });

  it("T7: adjacent slot starting when a booking ends → Available", () => {
    expect(checkAvailability({ start: 660, end: 720 }, false, schedule)).toEqual({
      available: true,
    });
  });

  it("T8: existing booking data remains unchanged after checking availability", () => {
    const before = structuredClone(ROOM_BOOKINGS);

    checkAvailability({ start: 720, end: 780 }, false, schedule);
    checkAvailability({ start: 630, end: 700 }, false, schedule);
    checkAvailability({ start: 720, end: 780 }, true, schedule);
    checkAvailability({ start: 480, end: 530 }, false, schedule);

    expect(ROOM_BOOKINGS).toEqual(before);
  });
});
