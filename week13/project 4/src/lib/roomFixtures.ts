import type { Booking } from "@/lib/availability";

export const CURRENT_TIME = 540;

export const ROOM_NAME = "Room B-204";
export const ROOM_LOCATION = "Engineering Building, Floor 2";

export const ROOM_BOOKINGS: readonly Booking[] = [
  { start: 600, end: 660, label: "Intro to Algorithms — Lecture" },
];
