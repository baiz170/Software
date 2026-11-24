import { MINUTES_PER_DAY, formatTime } from "@/lib/availability";
import type { Booking } from "@/lib/availability";
import { CURRENT_TIME } from "@/lib/roomFixtures";

interface TimelineProps {
  bookings: readonly Booking[];
  requestedStart: number | null;
  requestedEnd: number | null;
}

const HOUR_MARKS = Array.from({ length: 25 }, (_, i) => i);

export default function Timeline({
  bookings,
  requestedStart,
  requestedEnd,
}: TimelineProps) {
  const pct = (m: number) => (m / MINUTES_PER_DAY) * 100;
  const hasRequest =
    requestedStart !== null &&
    requestedEnd !== null &&
    requestedStart < requestedEnd;

  return (
    <div className="w-full">
      <div className="relative h-16 w-full rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200">
        {bookings.map((b, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden rounded bg-amber-200/80 ring-1 ring-inset ring-amber-400"
            style={{ left: `${pct(b.start)}%`, width: `${pct(b.end - b.start)}%` }}
            title={`${b.label} (${formatTime(b.start)}–${formatTime(b.end)})`}
          >
            <span className="truncate px-1 text-[10px] font-medium text-amber-900">
              {b.label}
            </span>
          </div>
        ))}

        {hasRequest && (
          <div
            className="absolute top-0 bottom-0 rounded bg-blue-300/50 ring-1 ring-inset ring-blue-500"
            style={{
              left: `${pct(requestedStart!)}%`,
              width: `${pct(requestedEnd! - requestedStart!)}%`,
            }}
            title={`Requested ${formatTime(requestedStart!)}–${formatTime(requestedEnd!)}`}
          />
        )}

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
          style={{ left: `${pct(CURRENT_TIME)}%` }}
          title={`Now: ${formatTime(CURRENT_TIME)}`}
        >
          <span className="absolute -top-0.5 left-1 -translate-x-0 whitespace-nowrap rounded bg-rose-500 px-1 text-[9px] font-semibold text-white">
            Now
          </span>
        </div>
      </div>

      <div className="relative mt-1 h-4 w-full">
        {HOUR_MARKS.filter((h) => h % 3 === 0).map((h) => (
          <div
            key={h}
            className="absolute -translate-x-1/2 text-[10px] text-slate-400"
            style={{ left: `${pct(h * 60)}%` }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>
    </div>
  );
}
