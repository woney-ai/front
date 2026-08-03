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

- [ ] 1.1 Add `--wordmark-size: 2rem`, `--header-pad-y: 1.25rem`, `--header-h: calc(...)` to `:root`, AND rewrite `scroll-margin-top: calc(var(--header-h) + 2rem)` + its comment in the same edit — never land one without the other. Verify: `bunx tsc --noEmit -p tsconfig.app.json` (build stays green), `rg 'scroll-margin-top' src/index.css` shows the `calc()` form.
- [ ] 1.2 Add `text-wordmark` utility (`font-family: var(--font-display); font-size: var(--wordmark-size); line-height: 1; letter-spacing: -0.01em`). Verify: `bunx oxlint src`.
- [ ] 1.3 Add `--engraving-angle: 58deg` and `engraving-field` utility (17px period, 1.5px line, both angles from the shared var); refactor existing `engraving` to consume `--engraving-angle`. Verify: `bunx oxlint src`; `rg '58deg' src/index.css` shows one shared source.

## Phase 2: Wordmark Component

- [ ] 2.1 Create `src/components/brand/wordmark.tsx`: closed `variant: 'header' | 'card' | 'monogram'` union, no `size`/`className`/`style`/`children`/rest-spread. `header`/`card` render `text-wordmark text-bone`; `monogram` renders lowercase `w`, `font-mono text-[0.6875rem] font-medium text-[var(--foil)]` (flat, not `text-foil`). Verify: `bunx tsc --noEmit -p tsconfig.app.json` rejects `<Wordmark variant="x" />` and any prop outside the union.

## Phase 3: Call-Site Migration

- [ ] 3.1 `logo.tsx:6` → delegate to `<Wordmark variant="header" />`; drop `className` prop.
- [ ] 3.2 `single-use-card.tsx:129` → `<Wordmark variant="card" />`.
- [ ] 3.3 `agent-session.tsx:187` → `<Wordmark variant="monogram" />`.
- [ ] 3.4 `site-header.tsx`: `h-14` → `h-[var(--header-h)]`.
  Verify (3.1–3.4): `rg 'font-display' src` returns only headings + `index.css`; `bun run build`.

## Phase 4: Texture Application

- [ ] 4.1 `hero.tsx:9`, `closing-cta.tsx:7`: `engraving opacity-70` → `engraving-field` (full opacity). Verify: `bunx oxlint src`; visual: headless screenshot, page pitch visibly coarser than card, no moiré with `grain`.

## Phase 5: Tonal Promotions

- [ ] 5.1 `site-header.tsx:14` → `text-bone-dim`.
- [ ] 5.2 `site-footer.tsx:12` → `text-bone-dim`.
- [ ] 5.3 `section-heading.tsx:18` → `text-bone-dim`.
  Verify: `rg 'rule-mono' src` matches design's 15-row table exactly (3 `bone-dim`, 12 unchanged at `bone-faint`/`bone`/`foil`).

## Phase 6: Verification Script (PR 2)

- [ ] 6.1 Create `scripts/contrast-check.ts`: launch `chrome --headless --remote-debugging-port=9222`, drive CDP over Bun's built-in `WebSocket` (no new dependency); sweep `y ∈ {0,100,200,300,400,600}`; capture screenshots; decode via canvas `getImageData`; compute WCAG ratio per header element; report the minimum across the sweep; fail under 4.5:1. Verify: `bunx oxlint scripts`; run against served `dist` — all header elements report ≥4.5:1 at every sweep point.
- [ ] 6.2 Run `bunx @axe-core/cli` against served `dist` as the regression net outside the header.

## Phase 7: Final Audit

- [ ] 7.1 `bun run build` — prerender + hydration, zero console warnings. `bunx tsc --noEmit -p tsconfig.app.json`. `bunx oxlint src scripts`.
- [ ] 7.2 `rg 'prefers-reduced-motion|matchMedia|useLayoutEffect' src` — three original motion sites intact, nothing new.
- [ ] 7.3 Manual, NOT automatable: inspect the 1.5px/17px line at DPR 1 and DPR 2 in a headless-Chrome screenshot by eye — soft-papery at 1x vs. crisp at 2x, not mushy or a visible grid.
- [ ] 7.4 Manual, NOT automatable: inspect a 375px-viewport screenshot by eye — confirm the 4.5rem header does not push the hero's first line below the fold.

## Key Learnings

1. `scripts/contrast-check.ts` is a hand-rolled CDP client over Bun's WebSocket, not a thin wrapper — it materially changes the review-budget forecast versus the proposal's original estimate.
2. Header height and `scroll-margin-top` share one CSS custom-property chain, so they must be edited in a single task to avoid an inconsistent intermediate commit.
3. Two DPR/viewport checks (17px weave, 4.5rem header vs. 375px fold) have no automated proof and must stay flagged as human-eye verification.
