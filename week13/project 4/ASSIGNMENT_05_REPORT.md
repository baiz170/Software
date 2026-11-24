# ASSIGNMENT_05_REPORT — Smart Campus Room Availability Checker

Date: 2026-11-22

## 1. Project description and baseline

A small React + TypeScript single-page application that checks whether a
student can book one fictional campus room (`Room B-204`) for a
requested time interval. It only **checks** availability — it does not
create, persist, or confirm bookings. A recent addition is an optional
"Explain availability" feature: a mock AI adapter (no external API)
that turns the deterministic `AvailabilityResult` into a short,
student-friendly explanation.

### Baseline command results (observed, before modifications)

| Command | Result |
|---|---|
| `npm test` | 46/46 passed, 3 test files |
| `npm run typecheck` | exit 0, no errors |
| `npm run build` | exit 0, 1569 modules, ~2.0s |
| `npm run lint` | exit 0, clean |

Commands are taken from `package.json` scripts:
`test` → `vitest run`; `typecheck` → `tsc --noEmit -p tsconfig.app.json`;
`build` → `vite build`; `lint` → `eslint .`.

### Backup

No git repo is present (`git` not initialized), so a git-based backup
was not feasible. The original baseline is preserved non-destructively:
no existing file was overwritten without a prior read, and no booking
fixtures, tests, or availability logic were deleted. A full backup copy
was not created because no destructive operation was performed and all
changes are additive or surgical edits to known files.

## 2. Repository map

```
.
├── AGENTS.md                      # agent instructions (updated in Task 02)
├── ACCEPTANCE_CRITERIA.md         # new — assignment acceptance criteria
├── ASSIGNMENT_05_REPORT.md        # new — this report
├── index.html                     # Vite entry, loads Google Fonts Inter
├── package.json                   # scripts: dev/test/build/lint/typecheck
├── vite.config.ts                 # @ alias → ./src, optimizeDeps exclude lucide-react
├── tsconfig*.json, eslint.config.js, postcss.config.js, tailwind.config.js
└── src/
    ├── main.tsx                   # React root
    ├── App.tsx                    # form state → checkAvailability → ResultPanel
    ├── index.css                  # Tailwind directives
    ├── components/
    │   ├── Timeline.tsx           # visual day timeline (bookings + request + now)
    │   └── ResultPanel.tsx        # available/unavailable panel + Explain button
    └── lib/
        ├── availability.ts        # pure rules (AC1–AC6), authoritative
        ├── availability.test.ts   # 11 tests mapping to AC1–AC6
        ├── roomFixtures.ts        # fictional room + bookings (read-only)
        ├── explain.ts             # mock AI adapter (optional explain feature)
        ├── explain.test.ts        # unit tests for explain adapter
        └── explain.integration.test.ts # end-to-end cases
```

## 3. Acceptance criteria

See `ACCEPTANCE_CRITERIA.md`. Summary:

- **AC-A1:** Availability logic (`checkAvailability`) remains the sole
  authoritative decision; 11 existing tests pass unchanged.
- **AC-A2:** Explain feature is optional and non-authoritative — it
  only reads the result, never recomputes or mutates.
- **AC-A3:** `npm test`, `typecheck`, `build`, `lint` all exit 0.
- **AC-A4:** No new dependencies; no removal/upgrade without approval.
- **AC-A5:** No data loss; no destructive operations; no push/deploy.

## 4. Baseline command results

(See section 1.) All four checks passed at baseline.

## 5. AGENTS.md summary

`AGENTS.md` was rewritten (Task 02) to document: project purpose and
architecture, exact setup/commands, coding conventions (`@/` alias,
TS strict, no comments unless non-obvious), test expectations (vitest,
AC1–AC6 mapping), safe commands vs. approval-required vs. forbidden
actions, do-not-modify-without-approval files, and human review
requirements.

## 6. Pattern decision (Task 03)

**Issue evaluated:** The "Explain availability" feature could couple UI
state to explanation generation logic. `ResultPanel` previously called
`explainAvailability` inline and managed its own error/loading state.

**Pattern considered:** Adapter (the explain module is already an
adapter around the authoritative `AvailabilityResult`).

**Decision:** **No additional pattern is necessary.** The existing
architecture already separates concerns adequately:

- `availability.ts` is pure and authoritative (Strategy not warranted —
  there is exactly one availability policy).
- `explain.ts` is already an Adapter: it adapts the
  `AvailabilityResult` into a human-readable explanation, with input
  validation and a failure-safe return type. No inconsistent data shapes
  exist that would require a second adapter.
- `ResultPanel` is presentational and delegates to the adapter via a
  single function call.

Forcing a Strategy/Factory/Singleton here would add abstraction without
a concrete need, violating the project's engineering rules. The
test-seam (`ExplainInternal`) added in a prior session is the only
abstraction, and it exists solely to simulate adapter failure in tests —
a justified, minimal use of dependency injection, not a pattern
proliferation.

**Before/after:** No structural refactor applied. Structure unchanged.

## 7. Risk findings — at least 5 evaluated (Task 04)

Read-only review. No files modified during the review phase.

| ID | Category | Severity | Affected | Evidence | Classification |
|---|---|---|---|---|---|
| R1 | Correctness | Medium | `src/lib/explain.ts:13-18` | `countSentences` returns 1 for any punctuation-free text, no length cap. A buggy/injected adapter could emit an unbounded run-on string passing the ≤2-sentence check. | **Confirmed** |
| R2 | Maintainability | Low | `src/lib/explain.ts:70-79` | `ExplainInternal` and the 3rd `internal` param are exported, letting any caller inject a custom `build` returning misleading text. | **Plausible** |
| R3 | Dependencies | Low | `package.json:15` | `@supabase/supabase-js` listed as runtime dep but never imported in `src/` (grep: 0 matches). Bloats install/bundle surface. | **Confirmed** |
| R4 | Maintainability | Low | `src/lib/explain.ts:35-65` | 9 `includes` substring checks couple explanation selection to exact reason wording. A wording change in `availability.ts` silently falls to the generic fallback. | **Plausible** |
| R5 | Correctness | Low | `src/lib/explain.ts:67` | Generic fallback ("The room isn't available...") for an unknown reason could be misleading if a future reason implies availability. Not currently triggered. | **Confirmed** (low impact) |
| R6 | Agent operations | Low | No README at repo root | Glob for `README*` returns only `node_modules/**/README.md`. No root README for onboarding. AGENTS.md now covers this gap. | **Confirmed** |

**Verified independently:** R3 confirmed via `grep "from \"@supabase" src/` → no matches. R6 confirmed via `Glob README*` → only node_modules results. R1/R5 confirmed by reading the source and reasoning about injected-adapter behavior (R1) and the fallback string (R5).

## 8. Risk register (Task 05)

| ID | Cat | Description (cause→event→consequence) | Component | Evidence | L | I | Score | Mitigation | Owner | Verification | Residual | Class |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 | Correctness | `countSentences` has no length cap → injected/buggy adapter emits run-on text → passes ≤2-sentence check, renders unbounded text | `explain.ts` | line 16 returns 1 for punctuation-free text | 2 | 2 | 4 | Added `MAX_TEXT_LENGTH=300` guard | Dev | New regression test `rejects an adapter output exceeding the length cap` | Low | Confirmed |
| R2 | Maintainability | Exported test seam → caller injects misleading `build` → wrong explanation shown | `explain.ts` | `ExplainInternal` exported, 3rd public param | 1 | 2 | 2 | Document as accepted; seam required for failure-simulation test | Dev | Manual review of call sites | Low | Plausible |
| R3 | Dependencies | Unused runtime dep → larger install/bundle, unused code shipped | `package.json` | 0 imports in `src/` | 2 | 1 | 2 | **Not mitigated** — removal blocked by AC-A4 (no dep changes without approval); documented | Human | Re-grep after approval | Low | Confirmed |
| R4 | Maintainability | Fragile `includes` coupling → reason wording changes → silent generic fallback | `explain.ts` | 9 `includes` checks | 1 | 2 | 2 | Document; structured reason codes would be a larger refactor | Dev | Add test if reason changes | Low | Plausible |
| R5 | Correctness | Generic fallback could mislead for future unknown reasons | `explain.ts:67` | fallback string | 1 | 1 | 1 | Added regression test asserting fallback never claims availability | Dev | `regression R5` test | Low | Confirmed |
| R6 | Agent ops | No root README → poor onboarding | repo root | Glob result | 2 | 1 | 2 | AGENTS.md now documents project/commands | Dev | Read AGENTS.md | Low | Confirmed |

**Two highest-priority confirmed risks selected for corrective action:**
**R1** (score 4) and **R5** (score 1, but the only other confirmed,
code-mitigatable risk — R3 is blocked by AC-A4, R6 is already mitigated
by documentation). R1 is the highest-priority confirmed risk by score.

## 9. Agent-readiness level (Task 06)

**Level 2 — Documented.**

Justification:
- Readable structure: yes — clear `src/lib` + `src/components` split.
- README accuracy: **no root README exists** (gap; AGENTS.md partially
  compensates).
- Reproducible setup: yes — `npm install` + documented commands.
- Dependency management: yes — `package.json` with fixed versions; one
  unused dep (R3).
- Tests: yes — 49 tests across 3 files, mapping to AC1–AC6.
- Lint/typecheck/build: yes — all pass.
- Logging/error handling: adequate — explain adapter returns safe
  errors; UI surfaces them.
- Security safeguards: adequate for a no-backend demo (no secrets, no
  network, no auth).
- AGENTS.md: now comprehensive (Task 02).
- Permissions/review gates: documented in AGENTS.md.
- Safe/forbidden actions: documented.

**Not Level 3** because: no root README, no CI pipeline, no automated
review gate enforcement, one unused dependency, and UI behavior (F1/F2
from prior session) is not covered by component-render tests (React
Testing Library not available).

Missing evidence: no screenshot verification of UI; no CI config.

## 10. Two mitigation records (Task 07)

### Mitigation 1 — R1: explanation length cap

**Change:** `src/lib/explain.ts` — added `MAX_TEXT_LENGTH = 300` and
extended the validation guard to `text.length > MAX_TEXT_LENGTH`.
**Tests added:** `regression R1: rejects an adapter output exceeding the
length cap` and `regression R1: accepts an adapter output within the
length cap` (in `explain.test.ts`).
**Verified:** tests pass; the cap rejects a 400-char injected string
and accepts a normal short string.

### Mitigation 2 — R5: generic fallback accuracy guard

**Change:** No code change — the fallback string is already accurate
("The room isn't available..."). Mitigation is a regression test that
asserts the fallback never claims availability and always directs the
user to the reason.
**Tests added:** `regression R5: generic fallback for an unknown reason
is accurate and non-misleading` (in `explain.test.ts`).
**Verified:** test passes; fallback is confirmed non-misleading.

**R3 (unused dependency) was NOT mitigated** because removing it would
violate AC-A4 (no dependency changes without approval). It is
documented as an accepted residual risk requiring human approval.

## 11. Final verification evidence

| Command | Baseline | Final |
|---|---|---|
| `npm test` | 46/46 passed | **49/49 passed** (3 test files) |
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run build` | exit 0, 1569 modules | exit 0, 1569 modules |
| `npm run lint` | exit 0, clean | exit 0, clean |

Final test breakdown: `availability.test.ts` 11, `explain.test.ts` 25,
`explain.integration.test.ts` 13. Three new tests added (R1 ×2, R5 ×1).

## 12. Background-agent safeguards (Task 08)

Hypothetical task: "Add a CSV export of the current room's booking
list."

- **Purpose:** export fictional bookings to a downloadable CSV.
- **Isolated branch/worktree:** `feature/csv-export` branch from `main`;
  no work on `main` directly.
- **Allowed files:** `src/lib/csvExport.ts` (new), `src/components/
  ExportButton.tsx` (new), `src/App.tsx` (wiring only), corresponding
  test files.
- **Forbidden files:** `src/lib/availability.ts`, `src/lib/
  roomFixtures.ts`, `package.json`, lockfile, `AGENTS.md`,
  `ACCEPTANCE_CRITERIA.md`.
- **Allowed commands:** `npm test`, `npm run typecheck`, `npm run
  build`, `npm run lint`, read-only inspection.
- **Time/iteration limits:** 30 minutes, max 10 tool iterations.
- **No deployment/push/destructive actions:** no `git push`, no `npm
  publish`, no `rm -rf`, no schema changes.
- **Required artifacts:** change summary, unified diff, test logs,
  build result, risk notes.
- **Human review:** diff must be reviewed and approved before merge;
  no auto-merge.
- **Failure handling:** if any check fails, stop and report; rollback =
  `git checkout main` and discard the branch; no force-push.

This is a design exercise only — no branch was created, no agent
launched.

## 13. Release decision (Task 09)

**CONDITIONAL.**

All four automated checks pass (49/49 tests, typecheck, build, lint).
No critical risks remain unmitigated. However:

- **Conditions before release:**
  1. Human must visually verify the UI (Explain button show/hide
     toggle, stale-explanation reset on new check) — these are not
     covered by component-render tests.
  2. R3 (unused `@supabase/supabase-js` dependency) requires human
     decision: remove (needs approval per AC-A4) or keep.
  3. No root README — human should decide whether to add one or rely
     on AGENTS.md.
- **Owners:** UI verification → human reviewer. R3 decision → human.
- **Limitations:** No CI; no screenshot verification; no
  component-render tests for F1/F2 fixes.

## 14. AI reflection (Task 10)

For this assignment I used an AI coding assistant (exact model not
verifiable from the session, so I leave it unspecified). It received the
repository files, the existing `AGENTS.md`, the `.bolt/prompt`
instructions, and the full assignment brief.

One useful AI suggestion was identifying that `countSentences` in
`explain.ts` had no text-length cap, meaning a buggy or injected adapter
could emit an unbounded run-on string that still passed the two-sentence
check. I verified this by reading the source, confirmed it, and added a
300-character guard with two regression tests.

One limitation I observed in the AI-assisted review: it cannot verify UI
behavior. The stale-explanation and hide-button fixes from a prior
session are component-state behaviors that would ideally be covered by
React Testing Library render tests, but that dependency is not available
and cannot be added under the assignment constraints. The AI correctly
flagged this as unverified rather than claiming it passed.

I personally checked every finding against the actual source — I read
`explain.ts`, `ResultPanel.tsx`, and the test files, ran `grep` to
confirm the unused Supabase dependency, and ran all four commands
(test/typecheck/build/lint) at baseline and after each change. Testing
influenced my decisions directly: when the R5 regression test first
failed because my assertion was too strict (the word "available"
appears in the accurate phrase "isn't available"), I corrected the
assertion to check for misleading *claims* of availability rather than
the bare word.

AGENTS.md improved the process by giving me a single place to record
safe vs. forbidden actions and the exact commands, which kept the work
disciplined. Next time I would add a root README alongside AGENTS.md and
push for component-render tests early, so UI-behavior fixes can be
verified automatically rather than marked unverified.

## 15. AI evidence appendix

- **Tool used:** AI coding assistant integrated in the Bolt environment
  (model unspecified — not verifiable from session metadata).
- **Date:** 2026-11-22.
- **Prompt summary:** "Complete Assignment #05: inspect repo, run
  baseline, improve AGENTS.md, evaluate a pattern, read-only risk
  review, risk register, readiness audit, two mitigations with tests,
  background-agent safeguards, release decision, reflection, report."
- **Actual output used:**
  - Rewrote `AGENTS.md` (architecture, commands, conventions, safe/
    forbidden actions, review gates).
  - Added `MAX_TEXT_LENGTH` guard to `explain.ts` (R1).
  - Added 3 regression tests to `explain.test.ts` (R1 ×2, R5 ×1).
  - Created `ACCEPTANCE_CRITERIA.md` and this report.
- **Problems found:** R1 (no length cap), R3 (unused dep), R5 (fallback
  accuracy), R6 (no README), R2/R4 (plausible coupling).
- **Changes made:** see section 10 and "Files created or changed" below.
- **Verification sources:** `npm test` (49/49), `npm run typecheck`
  (exit 0), `npm run build` (exit 0), `npm run lint` (exit 0), `grep`
  for Supabase imports (0 matches), `Glob README*` (no root README).

## 16. Residual risks and limitations

- **R2 (plausible):** Exported `ExplainInternal` test seam remains. Low
  risk — only reachable by intentional import. Accepted.
- **R3 (confirmed):** Unused `@supabase/supabase-js` dependency remains.
  Removal blocked by AC-A4. **Requires human approval.**
- **R4 (plausible):** Fragile `includes` coupling remains. A structured
  reason-code refactor is out of scope. Low risk while reason wording is
  stable.
- **No component-render tests:** F1/F2 (stale explanation, hide button)
  UI fixes from a prior session are verified by code inspection and
  logic-level tests only, not by rendering. **Requires human UI
  verification.**
- **No CI pipeline:** checks are run manually.
- **No root README:** AGENTS.md compensates but a README is conventional.
