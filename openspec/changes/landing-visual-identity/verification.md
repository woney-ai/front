# Verification Report: landing-visual-identity

**Change**: `landing-visual-identity` | **Commit**: `53609e50fa9da05c3b94b2b352ddbf76bbcca973`
**Mode**: Full artifacts (proposal + spec + design + tasks) | **Verdict**: **PASS WITH WARNINGS**

## Completeness

26/26 tasks marked `[x]` in `tasks.md`, cross-checked against the shipped diff (`git show --stat 53609e5`, 12 files, +150/-45). No unchecked task. No task claims code that is absent.

## Command evidence (all run fresh, real output)

| Command | Exit | Result |
|---|---|---|
| `bun run build` | 0 | `tsc -b` + `vite build` + SSR build + `bun scripts/prerender.ts` all succeeded. Prerender: "injected 20559 bytes, ~582 words readable without JavaScript" |
| `bunx oxlint src scripts` | 0 | clean |
| `bunx tsc --noEmit -p tsconfig.app.json` | 0 | clean |
| `bunx prettier --check .` | 0 | "All matched files use Prettier code style!" |
| `bunx @axe-core/cli http://localhost:4321/ --exit` (against `bun run preview --port 4321`) | 0 | "0 violations found!" — matches design.md's claimed evidence |

No contradiction with `.prettierrc.json` or oxlint config. Prerender build completes and injects static HTML (see requirement 6 below).

## Spec compliance matrix (brand-wordmark)

### 1. Serif floor is structurally enforced — PASS
- `Wordmark` (`src/components/brand/wordmark.tsx`) has a closed `variant: 'header' | 'card' | 'monogram'` union, no `size`/`className`/`style`/`children`/rest-spread — confirmed by reading the component source (41 lines, no extra props).
- All three named call sites route through it: `logo.tsx:6` → `<Wordmark variant="header" />`, `single-use-card.tsx:130` → `<Wordmark variant="card" />`, `agent-session.tsx:188` → `<Wordmark variant="monogram" />`.
- `rg 'font-display' src` returns only `index.css` (the `--font-display`/`--font-heading` tokens and the `text-wordmark` utility) and the four heading call sites (`hero.tsx:35`, `section-heading.tsx:20`, `closing-cta.tsx:20`, `audiences.tsx:33`) — no inline wordmark markup survives.
- All four headings' `clamp()` minimums are checked, not just brand marks: `clamp(3rem,...)`, `clamp(2.35rem,...)`, `clamp(2.1rem,...)`, `clamp(2.05rem,...)` — every minimum is >= 2rem (2.05rem is the tightest, still above the floor).
- `--wordmark-size: 2rem` is declared exactly once, under `:root, .dark` (`index.css:69`) — `rg 'wordmark-size' src` finds no other declaration or narrower-scope override. `text-wordmark` reads it via `rem`, so a parent `font-size` cannot shrink it by inheritance.
- Monogram variant renders `font-mono`, not `font-display`, confirmed in source and documented in the component's own doc comment as intentionally non-serif (Decision 3 rationale).
- Apply-progress (Engram #373) records that during apply, probe files tested `variant="huge"`, a `className` prop, and a `size` prop against `tsc` and all failed, plus `<Logo className="x" />` was confirmed rejected — five escape attempts, matching the commit message's claim. Probe files were deleted after use (not re-runnable now), but the closed-API structure that made them fail is present and unchanged in the shipped code, and `tsc --noEmit` passes clean today.

### 2. Header height / scroll-margin-top coupled at source — PASS
- `--header-h: calc(var(--wordmark-size) + 2 * var(--header-pad-y))` (`index.css:72`); `site-header.tsx:6` uses `h-[var(--header-h)]`; `scroll-margin-top: calc(var(--header-h) + 2rem)` (`index.css:144`).
- `rg 'h-14|5\.5rem|scroll-margin-top' src` finds zero literal survivors — the only remaining mentions of `h-14`/`5.5rem` are inside the explanatory code comment describing the old value, not live values.
- Comment above `scroll-margin-top` was rewritten to describe the derivation mechanism, matching the design.md text.

### 3. Texture differs by pitch, not opacity — PASS
- `hero.tsx:9` and `closing-cta.tsx:7` both changed from `engraving opacity-70` to bare `engraving-field` (no opacity modifier) — full opacity confirmed by absence of any `opacity-*` class on those elements.
- `engraving-field` is a closed `@utility` (`index.css:203`) with hardcoded 17px/1.5px values — it takes no parameters, so no caller can invent a different pitch; only `--engraving-angle` (shared, 58deg) is parametric, and angle is explicitly not the differentiating property per design.md.
- `engraving` (card) is unchanged at 7px/1px except for consuming the shared `--engraving-angle` var instead of a literal `58deg` — the pitch values themselves (7px vs 17px) are untouched, matching the "period unchanged" requirement.
- `grain` utility (`index.css:218`) unchanged: `opacity: 0.32; mix-blend-mode: overlay`.

### 4. rule-mono promotion follows the stated rule — PASS (all 15 instances audited)
`rg 'rule-mono' src` returns 15 non-definition/non-comment instances (excluding `index.css:82` comment and `index.css:266` definition), cross-checked one by one against design.md's table:

| # | file:line | Token in code | Design table says | Match |
|---|---|---|---|---|
| 1 | `site-header.tsx:14` | `bone-dim` | → bone-dim | Yes |
| 2 | `site-header.tsx:20` | `bone` | unchanged | Yes |
| 3 | `site-footer.tsx:12` | `bone-dim` | → bone-dim | Yes |
| 4 | `site-footer.tsx:16` | `bone-faint` | unchanged | Yes |
| 5 | `hero.tsx:24` | `bone-faint` | unchanged | Yes |
| 6 | `hero.tsx:27` | `bone-faint` | unchanged | Yes |
| 7 | `hero.tsx:76` | `bone-faint` | unchanged | Yes |
| 8 | `section-heading.tsx:18` | `bone-dim` | → bone-dim | Yes |
| 9 | `capabilities.tsx:52` | `bone-faint` | unchanged | Yes |
| 10 | `audiences.tsx:28` | `foil` | unchanged | Yes |
| 11 | `agent-session.tsx:143` | `bone-faint` | unchanged | Yes |
| 12 | `agent-session.tsx:144` | `bone-faint` | unchanged | Yes |
| 13 | `single-use-card.tsx:134` | `signal`/`bone-dim` (conditional) | unchanged | Yes |
| 14 | `single-use-card.tsx:156` | `bone-faint` | unchanged | Yes |
| 15 | `single-use-card.tsx:182` | `bone-faint` | unchanged | Yes |

No instance the stated rule (operable-control-or-wayfinding-landmark → structural) would classify differently than implemented. The genuinely close call the design calls out (row 8 landmark vs. row 9 enumeration) is defensible under the operational test as written. Every promotion strictly increases contrast (5.44:1 → 8.58:1 per the source token comment); nothing moved down; no instance sits below `bone-faint`.

### 5. AA holds composited — PASS WITH WARNING
- Measured evidence table in design.md (min 8.39:1 nav, 17.17:1 CTA, 16.95:1 wordmark) is far above the 4.5:1 floor, and `bunx @axe-core/cli` independently returned 0 violations against the same served build — corroborating, not the sole evidence.
- Method scrutiny: the sweep covers `y ∈ {0,100,200,300,400,600}` (100px steps). The hero's light-source `div` (`hero.tsx:12-19`) is positioned `-top-64` (−256px) with `h-[46rem]` (736px), radial center ≈ local y=112px ≈ document y≈184px (given `--header-h`≈72px pushes hero's local origin down). At 100px sweep granularity, no sample lands exactly at document y≈184px (the geometric peak of the radial); the nearest samples are y=100 and y=200, both offset from the true peak by ~50-80px. **This means the reported minimum (8.39:1 at y=400 for `bone-dim`) is not provably the true worst case — it is the worst case *among six sampled points*, not a continuous minimum.** Given the margin between measured minimum (8.39:1) and the AA floor (4.5:1) is large (~1.9x), and the sweep values are tightly clustered (8.39–8.60 across all six points, a <2.5% spread), the risk that an unsampled point between 100 and 200 dips meaningfully lower is low — but the design.md claim that this "covers ... the worst case" is stronger than the method actually proves. This is a methodological gap, not a failing result.
- **WARNING, not CRITICAL**: the safety margin (minimum measured is 1.87x the AA floor) makes it very unlikely a finer sweep would cross 4.5:1, but the report should not claim the sweep proves the mathematical worst case — it proves a dense sample of it.
- The measurement tool itself (`scripts/contrast-check.ts`) is correctly absent from the repo per the delivery decision (`find`/`test -f` confirms — only `scripts/prerender.ts` exists in `scripts/`). This means the 8.39:1/17.17:1/16.95:1 numbers in design.md cannot be independently re-run today; they are asserted evidence, accepted per the recorded delivery decision, not re-verifiable by this verification pass.

### 6. First render deterministic — PASS
- `rg 'window\.|document\.|useLayoutEffect|matchMedia'` across `src` shows the only hits are in `use-reveal-sequence.ts`, `single-use-card.tsx` (pre-existing `prefers-reduced-motion`/timer logic, untouched by this diff — confirmed against the diff, neither file touches those lines), `waitlist-form`/`api.ts`, and `main.tsx` — none of these are in the changed-file list and none pick a wordmark/header/texture/tone value.
- All three `prefers-reduced-motion` sites (`index.css:147`, `use-reveal-sequence.ts:16`, `single-use-card.tsx:45`) are present and unmodified by this diff.
- `bun run build` prerender output (`dist/index.html`) was inspected directly: it contains static `class="text-wordmark text-bone"`, `h-[var(--header-h)]`, `engraving-field` markup baked into the server-rendered HTML — proving the values resolve identically without any client JS execution, consistent with hydration matching (same static CSS custom properties resolve the same way client-side since JS never reads them).

## Design coherence

No deviation found between `design.md`'s Decisions 1-4 and the shipped code. The "Bonus finding" (Logo rendered twice, footer also fixed) is confirmed: `site-footer.tsx:7` renders `<Logo />` and now also benefits from the `Wordmark` floor.

## Out-of-scope item confirmed untouched

`site-footer.tsx:17` still renders `© {new Date().getFullYear()} Woney` — the pre-existing prerender/hydration year-boundary hazard was correctly left unfixed, exactly as design.md records it as "out of scope."

## Issues

**CRITICAL**: None.

**WARNING**:
1. The composited-contrast sweep (`y` step 100px) does not sample the geometric peak of the hero's radial light source (~y=184px document-relative) exactly; design.md's claim that it "covers ... the worst case" overstates what a 6-point sweep proves. The large safety margin (min 8.39:1 vs 4.5:1 floor, tight 8.39-8.60 clustering) makes an actual AA failure very unlikely, but the report's wording should be softened to "densely sampled" rather than "the worst case," or a finer sweep should be run near y=150-200 before being cited as definitive.
2. The contrast measurement numbers in design.md are not independently re-runnable today, since `scripts/contrast-check.ts` was deliberately never committed (per delivery decision). This is an accepted, explicitly-recorded tradeoff, not a hidden gap — but it means future changes to the header backdrop cannot be checked without rebuilding the tool from scratch, as design.md itself states.

**SUGGESTION**:
1. Consider recording the exact document-relative position of the hero radial's peak intensity in design.md alongside the sweep table, so a future reviewer can judge sweep adequacy without re-deriving the geometry.

## Final Verdict

**PASS WITH WARNINGS.** All six spec requirements are satisfied by the shipped code with real command evidence (build, lint, typecheck, format, axe all exit 0). Tasks are complete and match the code. The out-of-scope footer-year hazard was correctly left alone. The one substantive finding is a methodological overstatement in design.md's AA sweep claim — the underlying numbers are safely above the AA floor by a wide margin, so this does not block archive, but the wording should be corrected if this design.md is reused as a template for future composited-contrast claims.
