# Acceptance Criteria — Assignment #05

These criteria must remain true throughout the assignment work.

## AC-A1 — Availability logic unchanged

`checkAvailability` in `src/lib/availability.ts` remains the sole
authoritative availability decision. Its existing behavior and the 11
tests in `src/lib/availability.test.ts` (AC1–AC6) must continue to pass
unchanged.

## AC-A2 — Explain feature is optional and non-authoritative

The "Explain availability" feature only reads an `AvailabilityResult`
produced by `checkAvailability`. It must never recompute availability,
mutate bookings, or alter booking logic.

## AC-A3 — All checks pass

`npm test`, `npm run typecheck`, `npm run build`, and `npm run lint`
must all exit 0 with no new errors.

## AC-A4 — No new dependencies

No packages may be added to `package.json`. Existing dependencies may
not be removed or upgraded without explicit approval.

## AC-A5 — No data loss or destructive changes

No booking fixtures, existing tests, or existing UI behavior may be
deleted or weakened. No `git push`, deploy, or destructive operations.
