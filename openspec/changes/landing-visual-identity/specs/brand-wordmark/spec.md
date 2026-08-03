# Brand Wordmark Specification

## Purpose

Sole authority for the Woney wordmark/monogram, an enforced serif floor, header
height coupling, page/card texture hierarchy, `rule-mono` tonal promotion,
composited header contrast, and prerender/hydration determinism.

## Requirements

### Requirement: Serif floor is structurally enforced

Any `font-display` (Instrument Serif) brand mark MUST render at or above 2rem
computed font-size, except the `monogram` variant, which is exempt from the
serif requirement entirely. A single `Wordmark` component MUST own this floor
via closed `variant` names (not raw size/className/style props), so no caller
can express a sub-floor serif instance. `logo.tsx:6`, `single-use-card.tsx:129`,
and `agent-session.tsx:187` MUST route through it; no inline `font-display`
wordmark markup may remain at any call site.

#### Scenario: Header and card wordmarks meet the floor; sub-floor is unreachable
- GIVEN `logo.tsx` renders `variant="header"` and `single-use-card.tsx:129`
  renders `variant="card"`
- WHEN computed font-size is inspected, and a developer tries to produce an
  18px/14px serif wordmark via public props
- THEN both render >= 2rem with no override lowering either, and no variant
  combination produces a sub-floor serif instance without editing the
  component's own source

#### Scenario: Monogram is exempt by design, not omission
- GIVEN `agent-session.tsx:187` renders `variant="monogram"`
- WHEN rendered output is inspected
- THEN it uses no `font-display` at any size, and the component source
  documents this variant as intentionally non-serif

### Requirement: Header height and scroll-margin-top are coupled at the source

Header height MUST fit a `header`-variant wordmark at >= 2rem without clipping.
`:target`/`:focus` `scroll-margin-top` MUST derive from the same single source
as header height (e.g. one shared CSS custom property), not two
independently-authored numbers held in sync by comment alone.

#### Scenario: Header fits the wordmark and scroll-margin-top tracks it
- GIVEN the header wordmark renders at >= 2rem, defined via one shared source
- WHEN the header is rendered and that source changes
- THEN the wordmark is not clipped, and `scroll-margin-top` changes with it
  without a second manual edit; the adjacent comment describes the mechanism

### Requirement: Page and card texture differ by line pitch, not opacity

`engraving` MUST render at full opacity on both page (`hero.tsx`,
`closing-cta.tsx`) and card (`single-use-card.tsx`). Page texture MUST use a
coarser repeating-line pitch than the card's existing 7px period; opacity MUST
NOT be the distinguishing property. `grain` (0.32 opacity, `overlay`) MUST
stay unchanged.

#### Scenario: Page and card are distinguishable by pitch, not opacity
- GIVEN page and card both render engraving-family texture at full opacity
- WHEN gradient periods are compared and `grain` is inspected
- THEN the page's period is measurably larger than the card's 7px,
  distinguishable at 1x/2x DPR, and `grain` remains 0.32/`overlay` unchanged

### Requirement: rule-mono promotion follows a stated, monotonic rule

Each `rule-mono` instance MUST be classified structural/navigational (nav
links, section anchors, wayfinding) or ambient/decorative. Structural
instances MUST render at `bone-dim` (8.58:1); ambient stays at `bone-faint`
(5.44:1). No instance may render below `bone-faint`. Every promotion MUST
strictly increase contrast (5.44:1 -> 8.58:1); none may decrease.

#### Scenario: Navigational promoted, ambient held, nothing regresses
- GIVEN a nav link and an ambient caption, both `rule-mono`, measured
  pre- and post-change
- WHEN tokens are inspected
- THEN the nav link is `bone-dim`, the caption remains `bone-faint`, and no
  instance's ratio is lower than its prior value

### Requirement: AA holds under composited header contrast

Header text MUST meet AA (>= 4.5:1) against its actual composited background
(`bg-ink/80` + `backdrop-blur-xl` over scrolled content), not token-to-token.
Verify at top-of-page and mid-scroll over the hero's `blur-3xl` radial (worst
case). Failing elements MUST be promoted to a higher-contrast token, not fixed
by altering `bg-ink/80`. No contrast ratio anywhere may decrease.

#### Scenario: Header passes composited contrast at both states
- GIVEN the header at scroll 0 and mid-scroll over the hero light source
- WHEN each header text element's composited contrast is measured (rendered
  screenshot or `@axe-core/cli` against live DOM)
- THEN every element is >= 4.5:1 in both states; failures are promoted to a
  higher token rather than changing `bg-ink/80`

#### Scenario: No page-wide contrast regression
- GIVEN all text/background pairs pre-change
- WHEN re-measured post-change
- THEN none is lower than its prior value

### Requirement: First render is deterministic

No wordmark, header, texture, or tone change may depend on client-only
measurement (`useLayoutEffect`, `matchMedia`, `window`/`document` reads). All
resolve via static CSS/markup.

#### Scenario: Prerender and hydration match with no client-only gating
- GIVEN `bun run build` prerenders the landing page and the affected code
  paths are inspected
- WHEN the page loads and hydrates
- THEN no hydration mismatch warning fires, no visible layout shift occurs,
  and no affected path reads `window`/`document` or uses
  `useLayoutEffect`/`matchMedia` to pick size, variant, or token
