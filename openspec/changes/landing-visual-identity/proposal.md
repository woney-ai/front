# Proposal: landing-visual-identity

## Intent

The landing page's brand marks are set below the size at which Instrument Serif
holds together, and the page outside the card reads flat. Two separable problems:
a **defect** (the ~2rem `font-display` floor is violated in all three brand marks
while every heading respects it) and a **design judgement** (page-level material
strength and tonal range). This change fixes the defect *structurally* and puts
the judgement in front of the owner rather than resolving it silently.

## Scope

### In scope

- One shared wordmark component that owns its own sizing; all three call sites
  route through it (`logo.tsx:6`, `single-use-card.tsx:129`, `agent-session.tsx:187`).
- Header height growth so a wordmark at or above the ~2rem floor fits
  (`site-header.tsx:6`, `h-14`). **Decided by the owner — not reopened here.**
- The coupled `scroll-margin-top` edit (`index.css:126-131`, currently `5.5rem`,
  tied by comment to `h-14`), plus updating that comment.
- Page-level material strength: an explicit owner decision, then implementation.
- Tonal range: redistribute existing tokens upward, no token value changes.

### Out of scope

- **Copy and product claims.** Nothing about what the page says.
- New colour accents. New animation. New motion vocabulary.
- Changing `bone-faint`, `bone-dim`, `foil`, or `ink` token values.
- Page-wide vertical rhythm / section spacing rework (see Risks).
- Any test infrastructure (repo has no test runner; `strict_tdd: false`).

## Capabilities

### New capabilities

- `brand-wordmark`: the single authority for how the Woney wordmark and monogram
  are rendered — typeface, minimum size, variants, and the enforced serif floor.

### Modified capabilities

None. `openspec/specs/` is empty; this is the first capability in the repo.

## 1. The structural fix (this matters more than the three numbers)

The floor was discovered in an earlier session, written to memory, and violated
anyway — in every brand mark, while every heading complied. That asymmetry is
diagnostic: headings are written by someone thinking about type, brand marks are
written by someone thinking about layout. A fix that edits three numbers will be
undone a fourth time.

Options weighed:

| Option | Enforces? | Cost | Verdict |
| --- | --- | --- | --- |
| Comment at each point of use | No — documentation, not enforcement | ~3 lines | Insufficient alone |
| Token / `text-wordmark` utility | No — a caller can still pass `text-sm` | ~6 lines | Necessary, not sufficient |
| Lint rule | Partially — oxlint has no ergonomic custom-rule path here, and arbitrary Tailwind values (`text-[1.375rem]`) resist static rem comparison | High, fragile | Rejected |
| **Shared component owning its sizing** | **Yes — the wrong thing becomes unreachable** | ~40 lines + 3 call-site edits | **Recommended** |

**Recommendation: a `Wordmark` component with a closed variant API, backed by a
`text-wordmark` utility that defines the floor once in `index.css`.**

Rationale: the component exposes `variant`, not `size`. There is no prop that can
express "18px serif wordmark", so the violation cannot be re-authored — it would
require deleting the component's API to reintroduce. The utility keeps the
component itself from drifting, and gives the floor a single named home that a
future reader will find. Comments and lint rules both depend on a person
noticing; the component does not.

Variants:

- `header` / `card` — serif at or above the floor.
- `monogram` (`agent-session.tsx:187`) — **not** serif. A single 14px `w` in
  `font-display`, additionally rendered via `text-foil`'s `background-clip: text`,
  is the most fragile mark on the page: gradient-clipped hairline stems at 14px.
  The floor is a *serif* floor; the honest resolution at avatar size is to leave
  the serif, not to grow the avatar and disturb the session-log rhythm. This is a
  small design call flagged for owner confirmation (see question round, Q3).

## 2. Owner decision — page-level material strength

The exploration established this is **not a defect**. `engraving` is full
strength on the card (`single-use-card.tsx:95`) and ~2.4% / 1.7% effective on the
page (`hero.tsx:9`, `closing-cta.tsx:7`, both `opacity-70`). That correctly
implements the documented hierarchy: *texture concentrates on the card, the page
stays quiet*. The owner's complaint — the page reads flat and characterless — is
about whether that hierarchy was set at the right strength, not about whether it
was built correctly.

**This is the owner's call. The options, honestly costed:**

| Option | Gains | Costs |
| --- | --- | --- |
| **A. Leave as designed** | Hierarchy stays crisp; zero risk; card remains unambiguously the focal object | Does not address the complaint at all. The page still reads flat |
| **B. Raise page texture (drop `opacity-70` → 3.5%/2.5%)** | Cheapest possible response, ~2 lines | Page and card now sit at *identical* strength. The documented hierarchy collapses — the card stops being special |
| **C. Differentiate by line pitch, not opacity** (page at full opacity but coarser weave, e.g. 7px → 11px period; card keeps the fine 7px weave) | Page gains perceptible material without competing with the card. Hierarchy is preserved and arguably *stronger*: coarse paper field vs. fine security print — which is how real engraved documents actually differ | Needs a second utility (`engraving-field`) and a visual check at 1x/2x DPR. ~15 lines |
| **D. Tonal range instead of texture** (see §3 only, no texture change) | Zero texture risk | Likely under-delivers on "lacks character" by itself |

**Recommendation: C, with §3 applied alongside.** It is the only option that
answers the complaint without spending the hierarchy the design deliberately
bought. But B is defensible if the owner decides the card/page distinction was
overvalued, and A is defensible if the owner, seeing it at 3x, decides the page
is fine. **Blocking: the owner must pick A, B, C, or D before `sdd-design`.**

Note: `grain` (0.32 opacity, `mix-blend-mode: overlay`) already contributes more
perceptually than `engraving`. If the owner picks C, `grain` strength should be
left alone so the two effects do not compound into visible noise.

## 3. Tonal range without regressing accessibility

Measured against `--ink`: `bone` 17.37:1, `foil` 12.48:1, `bone-dim` 8.58:1,
`bone-faint` 5.44:1. Only the `h1` and the filled CTA (`waitlist-form.tsx:111`)
leave the 5.44–8.58 band. 13+ `rule-mono` instances all sit in `bone-faint`.

**The constraint makes the direction obvious: range can only be added upward.**
`bone-faint` is exactly 5.44:1 and a prior 4.25:1 value was already rejected, so
nothing may move below it. Therefore:

- Promote a subset of `rule-mono` instances from `bone-faint` to `bone-dim`
  (8.58:1) on a stated rule — e.g. *navigational and structural* labels rise,
  *ambient/decorative* labels stay. This creates a two-step hierarchy inside the
  single most-repeated treatment on the page, and **every promotion strictly
  increases contrast**, so AA cannot regress by construction.
- Use `foil` (12.48:1, already in the palette) at one or two additional existing
  accent points. No new colour is introduced.
- Take the remaining separation from tracking, weight, and size rather than
  colour, which is contrast-neutral.

**Header contrast must be measured composited.** The header is `bg-ink/80` +
`backdrop-blur-xl` over whatever scrolls beneath it. Token-to-token ratios are
not valid there. Effective contrast of every header text element must be
verified against the composited backdrop, at both the top-of-page state and mid-
scroll over the hero's light source (`hero.tsx:12-14`, a `blur-3xl` radial at
`opacity-60`) — the worst case. If the composited ratio for `bone-faint` nav
links falls under 4.5:1, promote those links to `bone-dim` rather than adjusting
the header's `bg-ink/80`.

## Approach

1. Introduce `text-wordmark` in `index.css` + `Wordmark` component. Migrate three
   call sites. This lands independently of any design decision.
2. Grow the header to fit a ≥2rem wordmark; update `scroll-margin-top` and its
   now-stale comment in the same edit.
3. Apply the owner's texture decision (A/B/C/D).
4. Apply the tonal-range promotions; verify composited header contrast.
5. `bun run build` (tsc -b) + `bunx oxlint src`. No test runner exists.

## Affected areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/components/brand/wordmark.tsx` | New | Sole authority for wordmark rendering + floor |
| `src/components/brand/logo.tsx` | Modified | Delegates to `Wordmark` |
| `src/components/brand/single-use-card.tsx` | Modified | `:129` wordmark → `Wordmark`; `:95` engraving unchanged under C |
| `src/components/sections/agent-session.tsx` | Modified | `:187` monogram leaves the serif |
| `src/components/layout/site-header.tsx` | Modified | `h-14` grows; possible nav tone promotion |
| `src/index.css` | Modified | `text-wordmark`; `scroll-margin-top` + comment; `engraving-field` under C |
| `src/components/sections/hero.tsx`, `closing-cta.tsx` | Modified | Texture application, per owner decision |
| Various `rule-mono` call sites | Modified | Tone promotions |

## Non-goals

- Rewriting page copy or product claims.
- Reworking section spacing or vertical rhythm (explicitly deferred).
- Any new colour, gradient, or animation.
- Lowering any contrast value anywhere.
- Introducing a test runner.

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Header growth cascades into page-wide spacing rework | **High** | Hard boundary: only `scroll-margin-top` follows the header. Any other spacing change is a separate change. If sections visibly break, stop and report — do not retune rhythm inside this change |
| The floor is violated a fourth time | Medium | The component API has no size escape hatch; that is the whole point of §1 |
| `scroll-margin-top` desyncs from header height again | Medium | Derive both from one CSS custom property so they cannot drift; update the comment |
| Contrast regression in the composited header | Medium | Measure post-`bg-ink/80` + `backdrop-blur-xl` over the hero light source, not token-to-token |
| Hydration mismatch | Low | Build prerenders (`vite build --ssr`) then hydrates. All changes are static CSS/markup. **No client-only measurement** — no `useLayoutEffect` sizing, no `matchMedia` in first render |
| `prefers-reduced-motion` regression | Low | Honored in three places (`index.css:134`, `use-reveal-sequence.ts:16`, `single-use-card.tsx:43`). None are touched; verify all three still fire |
| Texture change reads as noise at 2x DPR | Medium (option C only) | Visual check at 1x and 2x before merge |

## Changed-line forecast

Budget: **400 lines** (`review_budget_lines: 400`).

| Work unit | Est. lines |
| --- | --- |
| `Wordmark` component + `text-wordmark` utility | ~55 |
| Three call-site migrations | ~30 |
| Header growth + `scroll-margin-top` + comment | ~20 |
| Texture (A: 0 / B: ~6 / C: ~35) | 0–35 |
| Tonal promotions across 13+ `rule-mono` sites | ~40 |
| **Total** | **~145–180** |

**Decision needed before apply: No**
**Chained PRs recommended: No**
**400-line budget risk: Low**

**One PR.** The forecast sits at roughly 40% of budget even under option C. The
work is also cohesive — the structural fix, the header growth, and the tonal pass
are one visual-identity story, and splitting them would produce an intermediate
state where the header has grown but the wordmark has not. Chain only if the
header-growth spacing cascade materialises, in which case slice 1 is the
structural fix + header and slice 2 is texture + tone.

## Rollback plan

Single-commit revert. All changes are presentational — no data model, no API, no
Supabase DDL (none required for this change), no persisted state, no migration.
Reverting restores `h-14`, `scroll-margin-top: 5.5rem`, and the three inline
wordmark spans exactly. Partial rollback is also available: option C's texture is
isolated to `index.css` + two `className` strings and can be reverted alone
without touching the `Wordmark` work.

## Dependencies

- **Owner decision on §2 (A/B/C/D) before `sdd-design` finalises.** This is the
  one hard blocker.
- Owner confirmation on the monogram leaving the serif (§1, variant `monogram`).

## Success criteria

- [ ] Every serif wordmark on the page renders at or above the ~2rem floor.
- [ ] All three brand marks render through one component; no inline `font-display`
      wordmark remains at any call site.
- [ ] Reintroducing a sub-floor serif wordmark is not expressible through the
      component's public API.
- [ ] `scroll-margin-top` derives from the same source as header height, and its
      comment matches reality.
- [ ] No contrast ratio anywhere on the page decreases; header ratios verified
      **composited**, including over the hero light source.
- [ ] `prefers-reduced-motion` still honored in all three original locations.
- [ ] `bun run build` and `bunx oxlint src` pass; prerender + hydration produce no
      mismatch warning.
- [ ] Owner confirms the page no longer reads flat.

## Proposal question round

Execution mode is interactive, but this executor cannot address the owner
directly. These need answers before `sdd-design` finalises:

1. **§2 is yours to decide: A (leave as designed), B (raise to parity), C
   (differentiate by line pitch), or D (tone only)?** Recommendation is C. This
   is the one blocking question.
2. Is the *stated rule* for tone promotion right — structural/navigational
   `rule-mono` rises to `bone-dim`, ambient stays at `bone-faint`? Or would you
   rather name the specific instances?
3. The avatar monogram (`agent-session.tsx:187`): accept dropping the serif at
   14px, or would you rather grow the avatar to fit a ≥2rem serif `w` and accept
   the session-log rhythm change?
4. How much header growth is acceptable — the minimum that clears the floor, or
   are you open to more if it improves the header's proportion?

### Assumptions made pending answers

- Header grows only as much as the ≥2rem wordmark requires; no other header
  restyling.
- Texture is planned as option C but implemented as whatever the owner picks.
- No `rule-mono` instance moves *down* in contrast under any option.
- The `Wordmark` component ships regardless of every design answer above — the
  structural fix is not contingent on the texture decision.

## Owner decisions

Recorded during the interactive proposal round.

| Question | Decision |
| --- | --- |
| Header sizing approach | **Grow the header** until a wordmark at or above the ~2rem floor fits. The compact-lockup alternative is rejected: two brand marks to keep in sync is a worse trade than one coupled `scroll-margin-top` edit. |
| §2 material strength | **Option C — differentiate by line pitch.** The page moves to full opacity with a coarser weave; the card keeps the fine weave. Chosen over raising opacity because that collapses the card/page hierarchy the design deliberately bought, and over leaving it because the page genuinely reads flat. |
| `grain` strength | Unchanged. It already contributes more perceptually than `engraving`; raising both would compound into noise rather than material. |

Still open, and answerable during design rather than blocking it:

- Whether the 14px avatar monogram drops the serif or the avatar grows.
- How much header growth beyond the minimum is welcome.
