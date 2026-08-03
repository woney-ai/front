# Tasks: landing-visual-identity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350–430 (recount: proposal's ~145–180 + `scripts/contrast-check.ts`, a hand-rolled CDP-over-WebSocket client with no library, ~150–230 lines alone) |
| 400-line budget risk | Medium (straddles the 400 line budget depending on script verbosity) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (visual/structural) → PR 2 (contrast-check tooling) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — user must pick stacked-to-main or feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Wordmark, header/scroll-margin coupling, texture, tonal promotions (~200–230 lines) | PR 1 | `bunx tsc --noEmit -p tsconfig.app.json` | `bun run build` + headless screenshots at DPR 1/2, 375px viewport | Single revert restores `h-14`, `scroll-margin-top: 5.5rem`, four inline wordmarks; texture separately revertable |
| 2 | `scripts/contrast-check.ts` CDP sweep, self-contained devtool | PR 2 | `bunx oxlint scripts` | `bun run build` then `bun scripts/contrast-check.ts` against served `dist` | Delete the file; no runtime coupling |

## Phase 1: CSS Foundation (index.css)

- [x] 1.1 Add `--wordmark-size: 2rem`, `--header-pad-y: 1.25rem`, `--header-h: calc(...)` to `:root`, AND rewrite `scroll-margin-top: calc(var(--header-h) + 2rem)` + its comment in the same edit — never land one without the other. Verify: `bunx tsc --noEmit -p tsconfig.app.json` (build stays green), `rg 'scroll-margin-top' src/index.css` shows the `calc()` form.
- [x] 1.2 Add `text-wordmark` utility (`font-family: var(--font-display); font-size: var(--wordmark-size); line-height: 1; letter-spacing: -0.01em`). Verify: `bunx oxlint src`.
- [x] 1.3 Add `--engraving-angle: 58deg` and `engraving-field` utility (17px period, 1.5px line, both angles from the shared var); refactor existing `engraving` to consume `--engraving-angle`. Verify: `bunx oxlint src`; `rg '58deg' src/index.css` shows one shared source.

## Phase 2: Wordmark Component

- [x] 2.1 Create `src/components/brand/wordmark.tsx`: closed `variant: 'header' | 'card' | 'monogram'` union, no `size`/`className`/`style`/`children`/rest-spread. `header`/`card` render `text-wordmark text-bone`; `monogram` renders lowercase `w`, `font-mono text-[0.6875rem] font-medium text-[var(--foil)]` (flat, not `text-foil`). Verify: `bunx tsc --noEmit -p tsconfig.app.json` rejects `<Wordmark variant="x" />` and any prop outside the union.

## Phase 3: Call-Site Migration

- [x] 3.1 `logo.tsx:6` → delegate to `<Wordmark variant="header" />`; drop `className` prop.
- [x] 3.2 `single-use-card.tsx:129` → `<Wordmark variant="card" />`.
- [x] 3.3 `agent-session.tsx:187` → `<Wordmark variant="monogram" />`.
- [x] 3.4 `site-header.tsx`: `h-14` → `h-[var(--header-h)]`.
  Verify (3.1–3.4): `rg 'font-display' src` returns only headings + `index.css`; `bun run build`.

## Phase 4: Texture Application

- [x] 4.1 `hero.tsx:9`, `closing-cta.tsx:7`: `engraving opacity-70` → `engraving-field` (full opacity). Verify: `bunx oxlint src`; visual: headless screenshot, page pitch visibly coarser than card, no moiré with `grain`.

## Phase 5: Tonal Promotions

- [x] 5.1 `site-header.tsx:14` → `text-bone-dim`.
- [x] 5.2 `site-footer.tsx:12` → `text-bone-dim`.
- [x] 5.3 `section-heading.tsx:18` → `text-bone-dim`.
  Verify: `rg 'rule-mono' src` matches design's 15-row table exactly (3 `bone-dim`, 12 unchanged at `bone-faint`/`bone`/`foil`).

## Phase 6: Composited Contrast Measurement (per Delivery decision — measured, not shipped)

- [x] 6.1 Measured, not shipped: built a one-off `contrast-check.ts` under the scratchpad (NOT committed to the repo), launching `chrome --headless --remote-debugging-port` and driving CDP over Bun's built-in `WebSocket`; swept `y ∈ {0,100,200,300,400,600}`; captured screenshots and decoded them via an in-page `<canvas>`/`getImageData` (no PNG library needed on the Bun side); computed WCAG ratio per header element; recorded the minimum across the sweep in `design.md` under "Measured evidence". All header elements ≥4.5:1 at every sweep point (min 8.39:1 for `bone-dim`, ~17:1 for `bone`).
- [x] 6.2 Ran `bunx @axe-core/cli http://localhost:4321/ --exit` against the served `dist` build as the regression net outside the header: 0 violations.

## Phase 7: Final Audit

- [x] 7.1 `bun run build` — prerender + hydration, zero console warnings. `bunx tsc --noEmit -p tsconfig.app.json`. `bunx oxlint src scripts`.
- [x] 7.2 `rg 'prefers-reduced-motion|matchMedia|useLayoutEffect' src` — three original motion sites intact, nothing new.
- [x] 7.3 Manual, NOT automatable: inspected the 1.5px/17px line at DPR 1 and DPR 2 in headless-Chrome screenshots by eye — soft-papery at 1x vs. crisper at 2x, reads as material not a visible grid.
- [x] 7.4 Manual, NOT automatable: inspected a true 375px-viewport screenshot (rendered via a 520px iframe wrapper, since headless Chrome clamps window width to 500px) by eye — the 4.5rem header does not push the hero's first line ("Agents can shop.") below the fold.

## Key Learnings

1. `scripts/contrast-check.ts` is a hand-rolled CDP client over Bun's WebSocket, not a thin wrapper — it materially changes the review-budget forecast versus the proposal's original estimate.
2. Header height and `scroll-margin-top` share one CSS custom-property chain, so they must be edited in a single task to avoid an inconsistent intermediate commit.
3. Two DPR/viewport checks (17px weave, 4.5rem header vs. 375px fold) have no automated proof and must stay flagged as human-eye verification.

## Delivery decision

Recorded under `ask-on-risk` when the recount straddled the 400-line budget.

**`scripts/contrast-check.ts` is NOT committed.** The composited header
measurement runs once from a scratchpad tool, and the measured ratios are
recorded in this change's artifacts as evidence. Phase 6 changes from "write and
ship a devtool" to "measure and record".

That keeps the change at roughly 180 lines — comfortably inside budget — and
delivers as **one PR**, no chaining.

The cost is stated so nobody is surprised by it later: if the header's backdrop
changes, the measurement has to be rebuilt rather than re-run. That is accepted
on the grounds that a devtool with no runtime coupling, which nothing in CI
invokes, is code someone maintains for a check that happens roughly never.

Evidence requirement is unchanged: the spec still demands composited
verification, and token-to-token ratios are still not sufficient for the header.
Only the tool's residency changed, not the standard of proof.
