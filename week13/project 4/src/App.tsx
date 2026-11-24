import { useState } from "react";
import { DoorOpen, Clock, MapPin, Search, Ban } from "lucide-react";
import {
  MAX_DURATION,
  checkAvailability,
  formatDuration,
  formatTime,
  timeToMinutes,
} from "@/lib/availability";
import type { AvailabilityResult } from "@/lib/availability";
import {
  CURRENT_TIME,
  ROOM_BOOKINGS,
  ROOM_NAME,
  ROOM_LOCATION,
} from "@/lib/roomFixtures";
import Timeline from "@/components/Timeline";
import ResultPanel from "@/components/ResultPanel";

function App() {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const requestedStart = startTime ? timeToMinutes(startTime) : null;
  const requestedEnd = endTime ? timeToMinutes(endTime) : null;

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const s = timeToMinutes(startTime);
    const en = timeToMinutes(endTime);

    if (s === null || en === null) {
      setResult({
        available: false,
        reason: "Please enter valid times in HH:MM format.",
      });
      return;
    }

    setResult(
      checkAvailability({ start: s, end: en }, blocked, {
        roomName: ROOM_NAME,
        bookings: ROOM_BOOKINGS,
        currentTime: CURRENT_TIME,
      }),
    );
  };

  const duration =
    requestedStart !== null && requestedEnd !== null && requestedEnd > requestedStart
      ? requestedEnd - requestedStart
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <DoorOpen className="h-4 w-4" />
            <span>Campus Facilities</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Smart Campus Room Availability Checker
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Check whether a time slot is open for a campus room. This tool
            verifies availability only — it does not create or confirm
            bookings.
          </p>
        </header>

        {/* Room card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {ROOM_NAME}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {ROOM_LOCATION}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Current time: {formatTime(CURRENT_TIME)}
                </span>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100">
              <input
                type="checkbox"
                checked={blocked}
                onChange={(e) => setBlocked(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <Ban className="h-3.5 w-3.5 text-rose-500" />
              Mark room as blocked
            </label>
          </div>

          {/* Timeline */}
          <div className="mt-5">
            <Timeline
              bookings={ROOM_BOOKINGS}
              requestedStart={requestedStart}
              requestedEnd={requestedEnd}
            />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-200 ring-1 ring-amber-400" />
                Existing booking
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-blue-300/60 ring-1 ring-blue-500" />
                Your request
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-0.5 bg-rose-500" />
                Now ({formatTime(CURRENT_TIME)})
              </span>
            </div>
          </div>
        </section>

        {/* Form */}
        <form onSubmit={handleCheck} className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-time"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Start time
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Must be after {formatTime(CURRENT_TIME)}
              </p>
            </div>
            <div>
              <label
                htmlFor="end-time"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                End time
              </label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Max duration: {MAX_DURATION} minutes
              </p>
            </div>
          </div>

          {duration !== null && (
            <p className="text-sm text-slate-500">
              Requested duration:{" "}
              <span className="font-medium text-slate-700">
                {formatDuration(duration)}
              </span>
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-[0.99]"
          >
            <Search className="h-4 w-4" />
            Check Availability
          </button>
        </form>

        {/* Result */}
        <ResultPanel result={result} roomName={ROOM_NAME} />

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-slate-400">
          This is a demonstration using fictional data. No real reservations are
          created or modified.
        </p>
      </div>
    </div>
  );
}

export default App;
