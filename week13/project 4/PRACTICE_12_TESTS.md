# PRACTICE_12_TESTS — Eight Shared Test Cases

Code-based reference fixture:

- Room: Room B-204
- Current time: 540 (09:00)
- Bookings: `[{ start: 600, end: 660, label: "Intro to Algorithms — Lecture" }]` (10:00–11:00)
- Max duration: 120 minutes

The tested Appsmith version used a date/time input and date-based
booking logic. The supplied screenshot evidence shows Room B-204 and a
10:00–11:00 booking, but the exact Appsmith widget values and blocked
room used for each manual case were not recorded here.

## Test cases

| ID | Description | Input | Expected | Code-based observed | Low-code observed | Pass/Fail (code) | Pass/Fail (low-code) |
|---|---|---|---|---|---|---|---|
| T1 | Valid future slot, 60 min, no overlap | start=720 (12:00), end=780 (13:00), blocked=false | Available | Available | Available | Pass | Pass |
| T2 | Overlaps existing booking | start=630 (10:30), end=700 (11:40), blocked=false | Unavailable | Unavailable — overlap with "Intro to Algorithms — Lecture" | Unavailable — overlap | Pass | Pass |
| T3 | Room is blocked | start=720, end=780, blocked=true | Unavailable | Unavailable — room blocked | Unavailable — room blocked | Pass | Pass |
| T4 | Duration is 0 | start=720, end=720, blocked=false | Validation error | Unavailable — "Start time must be earlier than end time." | Unavailable — validation error | Pass | Pass |
| T5 | Duration is 121 min | start=720, end=841, blocked=false | Validation error | Unavailable — "exceeds the 120-minute maximum." | Unavailable — validation error | Pass | Pass |
| T6 | Start time in the past | start=480 (08:00), end=530, blocked=false | Validation error | Unavailable — "must be strictly later than the current time (09:00)." | Unavailable — validation error | Pass | Pass |
| T7 | Adjacent slot, starts when booking ends | start=660 (11:00), end=720 (12:00), blocked=false | Available | Available | Available | Pass | Pass |
| T8 | Booking data unchanged after checks | Run T1–T3, then inspect bookings array | Bookings identical to original | Bookings identical | Bookings identical — verified by code inspection (see note) | Pass | Pass (code inspection) |

## Code-based results

**Verified 2026-11-24 via `npm test`:** 8/8 pass (part of 57/57 total).
Source: `src/lib/practice12.test.ts`.

## Low-code results

**T1–T7: verified 2026-11-24 by manual testing in Appsmith (user-reported).** All 7
cases pass, matching expected results.

**T8: verified by code inspection, not by independent UI test.** The
Appsmith `AvailabilityChecker` JS object reads the `BOOKINGS` array
using a loop / `.some()`-style check and never assigns to or pushes into
it. The `checkAvailability` function only returns a result object — it
does not mutate `BOOKINGS`. This was confirmed by inspecting the JS
object source, not by observing the array in the UI after a click.
Appsmith JS objects are also stateless per invocation, which reinforces
that the array cannot be mutated by a check call.

### Still pending (low-code)


