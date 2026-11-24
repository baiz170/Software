# PRACTICE_12_REPORT — Code-Based vs Low-Code Comparison

Date: 2026-11-24

## TASK 01 — Code-based baseline

### Architecture and technology stack

- **Framework:** React 18 + TypeScript, Vite 7 build tool.
- **Styling:** Tailwind CSS 3. **Icons:** lucide-react.
- **Testing:** vitest 5. **Linting:** eslint 9.
- **No backend, no database, no network calls.** Pure client-side demo.
- **Modules:**
  - `src/lib/availability.ts` — pure availability rules (authoritative).
  - `src/lib/roomFixtures.ts` — fictional room + booking data (read-only).
  - `src/lib/explain.ts` — optional mock AI explanation adapter.
  - `src/components/Timeline.tsx`, `ResultPanel.tsx` — presentational.
  - `src/App.tsx` — form state → `checkAvailability` → result display.

### Existing room fixture and booking data

- Room: **Room B-204**, Engineering Building, Floor 2.
- Current time: **540** (09:00).
- Bookings: `[{ start: 600, end: 660, label: "Intro to Algorithms — Lecture" }]` (10:00–11:00).

### Existing availability logic

`checkAvailability(req, blocked, schedule)` checks, in order:
1. Integer validation.
2. Within-day range (0–1440).
3. Start < end (duration > 0).
4. Start > current time (future).
5. Duration ≤ 120 min.
6. Blocked room.
7. Overlap with existing bookings (endpoint-touching allowed).

Returns `{ available: true }` or `{ available: false, reason }`.

### Input validation and UI behavior

- Start/end time via HTML `<input type="time">`; parsed by `timeToMinutes`.
- Invalid/empty → reason "Please enter valid times in HH:MM format."
- Result panel shows green (Available) or red (Unavailable) with reason.
- Optional "Explain availability" button generates a 2-sentence explanation.
- No booking data is ever mutated.

### Existing tests

- `availability.test.ts` — 11 tests (AC1–AC6).
- `explain.test.ts` — 25 tests.
- `explain.integration.test.ts` — 13 tests.
- `practice12.test.ts` — 8 shared test cases (new, Task 05).

### Baseline command results (observed 2026-11-24, before Task 05)

| Command | Result |
|---|---|
| `npm test` | 49/49 passed, 3 test files |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0, 1569 modules |
| `npm run lint` | exit 0, clean |

### Baseline screenshots required

1. Desktop full page (room card + timeline + form + result).
2. Available result with explanation expanded.
3. Unavailable (overlap) result with reason.
4. Narrow/mobile width (~375px).

## TASK 02 — Shared requirements

### User Story

As a student, I want to select a room start time and duration and see
whether the room is available, so that I can understand whether my
requested time slot can be used without changing existing bookings.

### Acceptance Criteria

| AC | Requirement |
|---|---|
| AC1 | Start time must be in the future. |
| AC2 | Duration must be greater than zero and at most 120 minutes. |
| AC3 | Overlapping bookings are unavailable. |
| AC4 | A blocked room is unavailable. |
| AC5 | Display a clear decision without changing existing bookings. |
| AC6 | Invalid input receives understandable feedback. |

### Shared fixture (code-based reference)

- Room name: Room B-204
- Current time: 540 (09:00)
- Bookings: `[{ start: 600, end: 660, label: "Intro to Algorithms — Lecture" }]`
- Max duration: 120 minutes

The code-based tests use this exact minute-based fixture. The supplied
Appsmith evidence shows an equivalent date-based implementation with a
B-204 booking from 10:00 to 11:00, but exact Appsmith widget values and
blocked-room input are not independently recoverable from the report.

## TASK 03 — Code-based implementation review

The existing application meets all six ACs. No refactor was needed.

| AC | Met? | Evidence |
|---|---|---|
| AC1 | Yes | `availability.ts:76` rejects `start <= currentTime`. |
| AC2 | Yes | `:69` rejects `start >= end` (duration 0); `:84` rejects duration > 120. |
| AC3 | Yes | `:98-105` rejects overlap; endpoint-touch allowed. |
| AC4 | Yes | `:91-96` rejects blocked room. |
| AC5 | Yes | `ResultPanel` displays Available/Unavailable; fixtures are `readonly` and never mutated. |
| AC6 | Yes | `App.tsx:34-40` handles invalid HH:MM; `checkAvailability` returns readable reasons. |

**No code changes were made in Task 03.**

## TASK 04 — Low-code implementation (Appsmith)

**Status: BUILT AND TESTED (T1–T7), T8 verified by code inspection.**
The Appsmith application was manually built and tested on 2026-11-24.
The tested screen uses a room selector, a date/time start input, and a
duration input. Its JavaScript includes a date-based booking record and
reads the booking list with `.some()`; this differs from the simplified
beginner template in `APPSMITH_IMPLEMENTATION.md`. T1–T7 were verified
by manual UI testing; T8 was verified by code inspection only (the
bookings array is read, never mutated — see `PRACTICE_12_TESTS.md`).
Security checks and timing measurements remain pending. A repository
search found no screenshot files under `/home/project`; three image
attachments were supplied separately as evidence, but their filesystem
locations are not available for verification.

## TASK 05 — Eight shared test cases

See `PRACTICE_12_TESTS.md` for the full table. Code-based results:

| Test | Expected | Code-based observed | Pass? |
|---|---|---|---|
| T1 | Available | Available | Pass |
| T2 | Unavailable | Unavailable (overlap) | Pass |
| T3 | Unavailable | Unavailable (blocked) | Pass |
| T4 | Validation error | Unavailable (start must be earlier) | Pass |
| T5 | Validation error | Unavailable (exceeds 120-min max) | Pass |
| T6 | Validation error | Unavailable (must be after 09:00) | Pass |
| T7 | Available | Available | Pass |
| T8 | Bookings unchanged | Bookings unchanged | Pass |

**Code-based: 8/8 pass.** Low-code: **7/8 pass by manual UI testing
(T1–T7); T8 pass by code inspection.**

Verified via `npm test` → 57/57 passed (including 8 new `practice12.test.ts` cases).
Low-code T1–T7 verified by manual testing in Appsmith on 2026-11-24.
Low-code T8 verified by code inspection of the `AvailabilityChecker` JS
object — the `BOOKINGS` array is only read, never mutated.

## TASK 06 — Comparison

| Dimension | Code-based (React/TS) | Low-code (Appsmith) |
|---|---|---|
| Functional tests | 8/8 pass (automated, verified) | T1–T7 pass (manual UI, user-reported); T8 pass (code inspection) |
| Time to build | Already built (prior sessions) | Pending — not measured |
| Time to fix | N/A this session | Pending — not measured |
| Customization | High — full control over UI, logic, tests | Medium — constrained by platform widgets |
| Maintainability | High — typed, tested, versioned source files | Medium — logic in platform JS objects; less portable |
| Security controls | Full control; no secrets, no network, no backend | Platform-managed; depends on Appsmith instance config |
| Versioning/portability | Git-friendly source files; deploys anywhere | Export JSON; tied to Appsmith runtime |
| Ongoing cost | Free (static hosting) | Free tier available; self-host or cloud fees at scale |

**Advantages — code-based:** full test automation, type safety, portable,
no platform lock-in, zero runtime cost.
**Disadvantages — code-based:** requires developer skill; more setup.
**Advantages — low-code:** faster for simple CRUD; visual builder; less
code to write.
**Disadvantages — low-code:** less testable, platform-dependent, harder
to version-control logic, limited customization.

**Recommendation (provisional):** For this specific use case — a
pure-logic availability checker with strict acceptance criteria and
automated tests — the **code-based approach is preferred** because the
test suite (8/8 verified automatically) and type safety provide
guarantees that a low-code build cannot match without significant
manual testing effort. The low-code approach matched the same 7
functional test cases by manual testing and is viable for rapid
prototyping by a non-developer, but lacks automated regression
protection.

## TASK 07 — Security review

### Code-based (verified)

| Check | Finding | Evidence |
|---|---|---|
| Input validation | Adequate — `checkAvailability` validates integers, range, order, duration | `availability.ts:55-89` |
| Output handling/XSS | Low risk — React escapes all interpolated text; no `dangerouslySetInnerHTML` | `ResultPanel.tsx`, `App.tsx` — no raw HTML injection |
| Permissions/public sharing | N/A — no backend, no auth, no data writes | No network calls in `src/` |
| Secrets | None — no `.env` secrets referenced in source; Supabase dep unused (0 imports) | `grep "from \"@supabase" src/` → 0 matches |
| Dependencies | One unused dep (`@supabase/supabase-js`); no known vulnerabilities scanned | `package.json:15` |
| Platform security/update | Developer-controlled; `npm audit` not run this session | Manual |
| Manual runtime checks | N/A — no running server in this environment | — |

**Limitations:** `npm audit` was not run (not in scope of the four
baseline commands). No dynamic/runtime security scan was performed.

### Low-code (Appsmith) — SECURITY REVIEW STATUS

The supplied Appsmith JavaScript was inspected, but no Appsmith editor,
sharing configuration, instance settings, or live security settings were
available in this environment. The following is therefore a complete
status record, not a claim that the pending platform checks passed:

| Check | Status | Evidence or limitation |
|---|---|---|
| Input validation | **Partially inspected** | Supplied JS visibly checks empty fields, numeric duration, duration bounds, date format, and future start. Full widget configuration was not available. |
| Output handling/XSS | **Pending** | Result is assembled as text in the supplied JS, but the Appsmith widget rendering/configuration was not available for inspection. |
| Permissions/public sharing | **Pending** | No Appsmith sharing or permission settings were supplied. |
| Secrets | **Partially inspected** | No secret or API key is visible in the supplied JS screenshot. Appsmith secret storage and instance configuration were not inspected. |
| Dependencies/platform updates | **Pending** | Appsmith version and dependency/update settings were not available. |
| Platform security/access control | **Pending** | No Appsmith instance administration or access-control settings were available. |
| Safe runtime security checks | **Pending** | Functional T1–T7 testing was reported, but no separate security-focused runtime checks were supplied. |

**Conclusion:** Appsmith security review is **incomplete**, with
platform and runtime checks pending. The code inspection provides only
partial evidence for input validation and secrets.

## TASK 08 — Comparison matrix and conclusion

| Criterion | Code-based | Low-code |
|---|---|---|
| Tests passed | 8/8 (automated, verified) | T1–T7 pass (manual UI, user-reported) + T8 (code inspection) |
| Implementation effort | Higher (typed code + tests) | Lower (visual builder) |
| Customization | Full | Platform-constrained |
| Security control | Full (no backend, no secrets) | Platform-dependent |
| Portability | High (static files) | Medium (Appsmith JSON export) |
| Cost | Free | Free tier; scaling costs |
| Testability | High (automated vitest) | Low (manual testing) |

**What each did well:** Code-based delivered verifiable, automated
correctness with zero runtime cost. Low-code delivered the same
functional outcomes (7/7 manual UI tests pass) with faster visual
assembly and less code to write.

**Preferred approach:** Code-based, for this use case, because the
acceptance criteria demand verifiable correctness and the existing
automated test suite provides 8/8 verified passes with regression
protection. Low-code matched the functional requirements but lacks
automated tests and its security posture remains unverified.

## AI reflection

I used an AI coding assistant to inspect the repository, run the
baseline checks, write the eight shared test cases, and draft the
Appsmith implementation instructions. The exact model is not verifiable
from the session, so I leave it unspecified.

A useful AI contribution was mapping the existing `checkAvailability`
logic directly to the eight shared test cases without modifying the
authoritative logic — the tests reuse the real fixture and rules,
ensuring the comparison is against the actual application, not a
reimplementation.

A limitation of the AI-assisted process is that Appsmith could not be
accessed from this environment, so the low-code testing was performed
manually outside the AI session and the results were reported back. The
AI correctly recorded T1–T7 as verified by manual testing and T8 as
verified by code inspection rather than claiming an independent UI
verification it did not perform. I personally verified the code-based
results by running `npm test` (57/57 pass), `npm run typecheck`, `npm
run build`, and `npm run lint` — all clean.

If I were to redo this, I would request access to an Appsmith instance
early so the low-code test results, timing, and security checks could
be recorded with real evidence in a single session.

## Remaining manual steps

1. ~~Create the Appsmith app.~~ Done.
2. ~~Run T1–T7 against the Appsmith app.~~ Done by manual testing.
3. ~~Verify T8.~~ Done by code inspection only; not an independent UI test.
4. Fill in build/fix timings for the low-code column — **pending; no time values were supplied**.
5. Run the low-code security checklist (Task 07) — **pending**.
6. Preserve/submit the supplied screenshots at the locations required by the course — **pending location verification**.

## Screenshot evidence and gaps

The following three files were supplied with the audit request. Their
filenames are recorded exactly, but their repository paths are not
verified:

| File | Evidence shown | Status |
|---|---|---|
| `Screenshot_2026-11-24_at_15.22.58.png` | Appsmith Available result for Room B-204 | Supplied attachment; location not verified |
| `Screenshot_2026-11-24_at_15.23.10.png` | Appsmith Unavailable result for a booked slot | Supplied attachment; location not verified |
| `Screenshot_2026-11-24_at_15.24.40.png` | Appsmith JavaScript showing date parsing, blocked-room list, booking data, and `.some()` overlap check | Supplied attachment; location not verified |

Still missing or unverified:

- Code-based desktop Available screenshot.
- Code-based desktop overlap screenshot.
- Code-based narrow/mobile screenshot.
- Code-based explanation-expanded screenshot, if required by the course.
- Appsmith builder-canvas screenshot.
- Confirmed repository/submission locations for the three supplied files.
- Repository search result: **no PNG, JPG, JPEG, GIF, or WEBP files found under `/home/project`**.
