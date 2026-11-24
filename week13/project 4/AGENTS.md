# AGENTS.md

## Project purpose

Smart Campus Room Availability Checker — a small React + TypeScript
demo that checks whether a student can book one fictional campus room
for a requested time interval. It only **checks** availability; it does
not create, persist, or confirm bookings.

Architecture (all in `src/`):

- `lib/availability.ts` — pure availability rules and helpers. This is
  the **authoritative** decision module; the UI must never recompute
  availability.
- `lib/roomFixtures.ts` — fictional room name, location, current time
  and booking list. Read-only.
- `lib/explain.ts` — optional "Explain availability" feature. A mock AI
  adapter (no external API) that turns an `AvailabilityResult` into a
  short, student-friendly explanation. It only reads the result; it
  never alters booking logic or data.
- `components/Timeline.tsx`, `components/ResultPanel.tsx` — presentational.
- `App.tsx` — wires form state to `checkAvailability` and renders results.

## Setup and commands (from package.json)

```bash
npm install      # install dependencies
npm run dev      # local dev server (do NOT run from automated agents)
npm test         # vitest run  — runs all *.test.ts files
npm run typecheck# tsc --noEmit -p tsconfig.app.json
npm run build    # vite build
npm run lint     # eslint .
```

Exact baseline (observed 2026-11-22): tests 46/46 pass, typecheck 0
errors, build succeeds, lint clean.

## Coding conventions

- JSX + Tailwind CSS classes, React hooks, `lucide-react` icons.
- Import project modules via the `@/` path alias (`@/lib/...`,
  `@/components/...`), not deep relative paths.
- TypeScript strict; give every parameter an explicit type.
- Pure functions for business logic; keep rules independent from UI and
  fixture data.
- No comments unless the *why* is non-obvious.
- Default to no comments; never leave dead code, commented-out blocks,
  or `_old` variants behind.

## Test expectations

- Test framework: vitest. Files: `*.test.ts` next to the module.
- Availability tests map to acceptance criteria AC1–AC6 (reversed
  interval, past time, 121-minute duration, blocked room, overlap,
  touching endpoints, fixture immutability).
- Explain tests cover input validation, each reason category, sentence
  limit (≤2), determinism, and simulated adapter failure.
- Do not weaken or delete existing assertions. Add focused regression
  tests for any change.

## Safe commands and permissions

- **Safe (automated):** `npm test`, `npm run typecheck`, `npm run build`,
  `npm run lint`, read-only file inspection.
- **Requires human approval:** modifying `availability.ts` logic,
  changing fixtures, adding/removing dependencies, changing
  `package.json`, deploying or publishing.
- **Forbidden:** `git push`, `npm publish`, production deployment,
  destructive operations (`rm -rf`, dropping tables/columns), committing
  secrets, unreviewed dependency changes.

## Do not modify without approval

- `src/lib/availability.ts` — core rules; changes require review.
- `src/lib/roomFixtures.ts` — fictional data is part of the spec.
- `package.json` / lockfile — no dependency changes without approval.
- Existing acceptance criteria (AC1–AC6) and their tests.

## Prohibited actions

- Exposing secrets or `.env` values in code, logs, or output.
- Destructive operations (delete files, drop data, overwrite user work).
- Production deployment, push, publish, or any external network call
  from the app.
- Unreviewed dependency additions or upgrades.
- `git commit` / `git push` unless explicitly requested.

## Human review requirements

- Every code change must be reviewed before merge.
- Risky or non-reversible actions (deployment, schema changes,
  dependency changes) require explicit human approval each time.
- If a check cannot be verified, mark it as **unverified** — do not
  claim it passed.
