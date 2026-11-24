# APPSMITH_IMPLEMENTATION — Low-Code Room Availability Checker

**Status: BUILT AND TESTED (T1–T7 by manual UI testing; T8 by code
inspection).** The Appsmith application was manually built and tested on
2026-11-24. The tested implementation is date-based and uses a room
selector, date/time start input, duration input, and a JavaScript overlap
check using `.some()`. It is not identical to the simplified minute-based
beginner template below; treat the template as a reference, and use the
reported results/evidence section for the tested implementation. T1–T7
pass; T8 was verified by inspecting the JS object source. Security
review is only partially inspected, platform checks remain pending,
timing measurements are **Not measured**, and screenshot locations are
unverified. See `PRACTICE_12_REPORT.md` Task 07.

## Prerequisites

- An Appsmith account (free tier: https://app.appsmith.com) or a
  self-hosted Appsmith instance.
- No coding experience required beyond copy-pasting the JS below.

## Step 1 — Create a new application

1. Log in to Appsmith. Click **Create New** → **Application**.
2. Name it "Room Availability Checker".
3. You should see a blank canvas with the widget palette on the left.

## Step 2 — Add widgets (exact layout)

Drag these widgets onto the canvas in this vertical order:

| Widget | Name (in right panel) | Configuration |
|---|---|---|
| Text | `TitleText` | Text: `Smart Campus Room Availability Checker`. Font size 24, bold. |
| Text | `RoomText` | Text: `Room B-204 — Engineering Building, Floor 2` |
| Text | `CurrentTimeText` | Text: `Current time: 09:00` |
| Text | `StartTimeLabel` | Text: `Start time (HH:MM)` |
| Select (dropdown) | `StartTimeSelect` | See Step 3 for options |
| Text | `DurationLabel` | Text: `Duration (minutes)` |
| Select (dropdown) | `DurationSelect` | See Step 3 for options |
| Checkbox | `BlockedCheckbox` | Label: `Mark room as blocked`, default unchecked |
| Button | `CheckButton` | Label: `Check Availability`, onClick: see Step 4 |
| Text | `ResultText` | Leave text empty; will be set by the JS object |

## Step 3 — Configure dropdown options

### StartTimeSelect

Set **Options** to (Source: Custom, format label/value):

```
[
  { "label": "09:30", "value": "570" },
  { "label": "10:00", "value": "600" },
  { "label": "10:30", "value": "630" },
  { "label": "11:00", "value": "660" },
  { "label": "11:30", "value": "690" },
  { "label": "12:00", "value": "720" },
  { "label": "12:30", "value": "750" },
  { "label": "13:00", "value": "780" },
  { "label": "08:00", "value": "480" }
]
```

The "08:00" option is included deliberately so T6 (past time) can be
tested. Default value: `720`.

### DurationSelect

Set **Options** to:

```
[
  { "label": "0 min", "value": "0" },
  { "label": "30 min", "value": "30" },
  { "label": "60 min", "value": "60" },
  { "label": "90 min", "value": "90" },
  { "label": "120 min", "value": "120" },
  { "label": "121 min", "value": "121" }
]
```

The "0 min" and "121 min" options are included for T4 and T5. Default
value: `60`.

## Step 4 — Create the JS Object (availability logic)

1. In the left panel, click **+** next to **JS Objects** → **New JS
   Object**.
2. Name it `AvailabilityChecker`.
3. Paste the following code (replaces the default template):

```javascript
export default {
  // Reference fixture for this simplified template
  CURRENT_TIME: 540,
  ROOM_NAME: "Room B-204",
  BOOKINGS: [
    { start: 600, end: 660, label: "Intro to Algorithms — Lecture" },
  ],
  MAX_DURATION: 120,

  formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  },

  checkAvailability(start, duration, blocked) {
    const s = Number(start);
    const d = Number(duration);

    if (!Number.isInteger(s) || !Number.isInteger(d)) {
      return { available: false, reason: "Please enter valid numeric values." };
    }

    const end = s + d;

    if (d <= 0) {
      return { available: false, reason: "Duration must be greater than zero." };
    }

    if (d > this.MAX_DURATION) {
      return {
        available: false,
        reason:
          "Requested duration is " +
          d +
          " minutes, which exceeds the " +
          this.MAX_DURATION +
          "-minute maximum.",
      };
    }

    if (s <= this.CURRENT_TIME) {
      return {
        available: false,
        reason:
          "Start time must be strictly later than the current time (" +
          this.formatTime(this.CURRENT_TIME) +
          ").",
      };
    }

    if (blocked) {
      return {
        available: false,
        reason: this.ROOM_NAME + " is currently blocked and cannot be reserved.",
      };
    }

    for (let i = 0; i < this.BOOKINGS.length; i++) {
      const booking = this.BOOKINGS[i];
      if (s < booking.end && end > booking.start) {
        return {
          available: false,
          reason:
            'Overlaps with existing booking "' +
            booking.label +
            '" (' +
            this.formatTime(booking.start) +
            "–" +
            this.formatTime(booking.end) +
            ").",
        };
      }
    }

    return { available: true };
  },
};
```

> **Note:** This reference JS object does NOT mutate `BOOKINGS`. It only
> reads the array. The separately tested Appsmith implementation also
> reads its booking list without mutation, as confirmed by code inspection.

## Step 5 — Wire the button

1. Select `CheckButton`.
2. In the right panel, set **onClick** to:

```
{{AvailabilityChecker.checkAvailability(StartTimeSelect.selectedOptionValue, DurationSelect.selectedOptionValue, BlockedCheckbox.isChecked)}}
```

3. Click the **+** next to the onClick event and add an action: **Set
   the text of a widget**.

   - Widget: `ResultText`
   - Text:
   ```
   {{(() => {
     const r = AvailabilityChecker.checkAvailability(
       StartTimeSelect.selectedOptionValue,
       DurationSelect.selectedOptionValue,
       BlockedCheckbox.isChecked
     );
     if (r.available) {
       return "✅ Available — this time slot is open and does not conflict with any existing booking.";
     }
     return "❌ Unavailable — " + r.reason;
   })()}}
   ```

## Step 6 — Style the result (optional)

- Set `ResultText` font size to 16, bold.
- Set text color to green when available or red when unavailable (use a
  conditional in the text binding if desired, or leave as plain text).

## Step 7 — Test

The tested Appsmith implementation has already been checked for T1–T7
by manual UI testing. T8 was checked by code inspection only. If
recreating the reference template, use the 8 cases in
`PRACTICE_12_TESTS.md` and record any new results separately; do not
substitute a recreation result for the reported tested-app evidence.

### Quick test guide

| Test | Start time | Duration | Blocked | Expected |
|---|---|---|---|---|
| T1 | 12:00 | 60 min | No | Available |
| T2 | 10:30 | 70 min* | No | Unavailable (overlap) |
| T3 | 12:00 | 60 min | Yes | Unavailable (blocked) |
| T4 | 12:00 | 0 min | No | Validation error |
| T5 | 12:00 | 121 min | No | Validation error |
| T6 | 08:00 | 50 min* | No | Validation error (past) |
| T7 | 11:00 | 60 min | No | Available |
| T8 | Run T1–T3, then check BOOKINGS array in the JS object editor | | | Unchanged |

\* For T2 and T6, use the closest available duration from the dropdown.
T2 with 60 min starting at 10:30 → end 11:30, still overlaps 10:00–11:00.
T6 with 30 min starting at 08:00 → end 08:30, past 09:00.

If you need a duration not in the dropdown (e.g., 70 min), add it to
`DurationSelect` options as `{ "label": "70 min", "value": "70" }`.

## Step 8 — Verify T8 (no mutation)

For a newly recreated reference template, inspect the
`AvailabilityChecker` JS object and confirm the `BOOKINGS` array remains:

```javascript
[{ start: 600, end: 660, label: "Intro to Algorithms — Lecture" }]
```

This is a code-inspection check, not an independent UI test. Appsmith JS
objects are stateless per invocation, and `checkAvailability` only reads
`BOOKINGS`.

## Test results (2026-11-24)

| Test | Result | Verification method |
|---|---|---|
| T1 | Pass — Available | Manual UI test |
| T2 | Pass — Unavailable (overlap) | Manual UI test |
| T3 | Pass — Unavailable (blocked) | Manual UI test |
| T4 | Pass — Validation error (duration 0) | Manual UI test |
| T5 | Pass — Validation error (121 min) | Manual UI test |
| T6 | Pass — Validation error (past time) | Manual UI test |
| T7 | Pass — Available (adjacent at 11:00) | Manual UI test |
| T8 | Pass — Bookings unchanged | Code inspection (JS object reads `BOOKINGS` via loop/`.some()`, never mutates) |

T8 was not verified by an independent UI observation. It was confirmed
by inspecting the `AvailabilityChecker` JS object source: the
`checkAvailability` function only reads `BOOKINGS` and returns a result
object — it does not assign to, push into, or otherwise mutate the
array. Appsmith JS objects are stateless per invocation, which
reinforces this.

## Limitations

- T1–T7 were tested manually; there is no automated test runner in
  Appsmith.
- T8 was verified by code inspection, not by observing the array in the
  UI after a click.
- Security review is **incomplete**. Supplied JavaScript was partially
  inspected for validation and visible secrets, but output rendering,
  sharing permissions, Appsmith version, platform access control, and
  security-focused runtime checks remain pending. See
  `PRACTICE_12_REPORT.md` Task 07.
- Build/fix timings are **Not measured**; no reliable timing records were
  supplied.
- No screenshot files were found under `/home/project`. Three Appsmith
  screenshots were supplied separately, but their repository/submission
  locations are **not verified**. Their exact filenames and evidence
  mapping are recorded in `PRACTICE_12_REPORT.md`.
- Widget property names may vary slightly between Appsmith versions.
- The dropdown approach limits free-form time entry; for full parity
  with the code-based app, a DatePicker widget could replace
  `StartTimeSelect`, but the dropdown is simpler for beginners.
