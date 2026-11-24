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

describe("checkAvailability", () => {
  it("rejects a start time equal to the end time (AC1)", () => {
    expect(checkAvailability({ start: 720, end: 720 }, false, schedule)).toEqual({
      available: false,
      reason: "Start time must be earlier than end time.",
    });
  });

  it("rejects a start time later than the end time (AC1)", () => {
    expect(checkAvailability({ start: 800, end: 720 }, false, schedule)).toEqual({
      available: false,
      reason: "Start time must be earlier than end time.",
    });
  });

  it("rejects a start time equal to the current time (AC2)", () => {
    expect(checkAvailability({ start: CURRENT_TIME, end: 600 }, false, schedule)).toEqual({
      available: false,
      reason: "Start time must be strictly later than the current time (09:00).",
    });
  });

  it("rejects a start time before the current time (AC2)", () => {
    expect(checkAvailability({ start: 480, end: 530 }, false, schedule)).toEqual({
      available: false,
      reason: "Start time must be strictly later than the current time (09:00).",
    });
  });

  it("accepts a duration of exactly 120 minutes (AC3)", () => {
    expect(checkAvailability({ start: 720, end: 840 }, false, schedule)).toEqual({
      available: true,
    });
  });

  it("rejects a duration of 121 minutes (AC3)", () => {
    expect(checkAvailability({ start: 720, end: 841 }, false, schedule)).toEqual({
      available: false,
      reason:
        "Requested duration is 121 minutes, which exceeds the 120-minute maximum.",
    });
  });

  it("rejects a blocked room (AC4)", () => {
    expect(checkAvailability({ start: 720, end: 780 }, true, schedule)).toEqual({
      available: false,
      reason: "Room B-204 is currently blocked and cannot be reserved.",
    });
  });

  it("rejects an interval overlapping an existing booking (AC5)", () => {
    expect(checkAvailability({ start: 630, end: 700 }, false, schedule)).toEqual({
      available: false,
      reason:
        'Overlaps with existing booking "Intro to Algorithms — Lecture" (10:00–11:00).',
    });
  });

  it("allows an interval ending exactly when a booking starts (AC5)", () => {
    expect(checkAvailability({ start: 550, end: 600 }, false, schedule)).toEqual({
      available: true,
    });
  });

  it("allows an interval starting exactly when a booking ends (AC5)", () => {
    expect(checkAvailability({ start: 660, end: 720 }, false, schedule)).toEqual({
      available: true,
    });
  });

  it("does not mutate booking fixtures (AC6)", () => {
    const before = structuredClone(ROOM_BOOKINGS);

    checkAvailability({ start: 630, end: 700 }, false, schedule);
    checkAvailability({ start: 550, end: 600 }, false, schedule);
    checkAvailability({ start: 720, end: 841 }, true, schedule);
    checkAvailability({ start: 800, end: 720 }, false, schedule);

    expect(ROOM_BOOKINGS).toEqual(before);
  });
});
