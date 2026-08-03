# Design: landing-visual-identity

## Technical Approach

Three CSS custom properties become the single source for every number this change
introduces (`--wordmark-size`, `--header-h`, `--engraving-angle`). A closed-API
`Wordmark` component makes the sub-floor serif inexpressible in TypeScript. A
second closed utility (`engraving-field`) differentiates page from card by pitch
at full opacity. Tonal range comes from three promotions on a stated rule. All
static CSS/markup — no client measurement, no new dependency.

Note: line references in the spec/proposal are pre-change; adding properties to
`:root` shifts `index.css` numbering downward.

---

## Decision 1 — Header height and wordmark size

**Choice**: `--wordmark-size: 2rem`, `--header-h: 4.5rem` (72px),
`scroll-margin-top: calc(var(--header-h) + 2rem)` = 6.5rem. All derived from one
declaration chain in `index.css :root`:

```css
:root {
  /* Instrument Serif is weight-400-only and very high contrast; below 2rem the
     stems break up. This is the floor, and it is the rendered size — not a
     minimum some caller is trusted to exceed. */
  --wordmark-size: 2rem;
  /* Breathing room above and below the wordmark's line box. */
  --header-pad-y: 1.25rem;
  --header-h: calc(var(--wordmark-size) + 2 * var(--header-pad-y));
}
```

`site-header.tsx` uses `h-[var(--header-h)]` instead of `h-14`.
`:target,:focus { scroll-margin-top: calc(var(--header-h) + 2rem); }` — the
`2rem` is the clearance the current `5.5rem` already encoded against `h-14`,
now expressed as the relationship rather than the sum. Changing
`--wordmark-size` moves the header and the anchor offset together; no second
edit, no comment holding two numbers in sync.

**Rationale for 4.5rem specifically.** The wordmark:bar ratio is 32:72 = 0.44,
against 22:56 = 0.39 today — the mark grows 45% while the bar grows 29%, so
the header gets *denser*, which is the point, without becoming cramped.

| Bar height | Ratio | Verdict |
| --- | --- | --- |
| 4rem | 0.50 | Rejected. 1rem padding; with `leading-none` the `y` descender in "woney" overshoots the 2rem line box and crowds `border-b` |
| **4.5rem** | **0.44** | **Chosen.** 1.25rem clear each side; descender safe |
| 5rem | 0.40 | Rejected. Best proportion, but 80px of sticky chrome on a mobile viewport whose entire job is the hero |

The card variant renders at the same `--wordmark-size`. One number, both marks —
so drift is visible immediately rather than deducible.

**Bonus finding**: `Logo` is rendered twice (`site-header.tsx:8`,
`site-footer.tsx:7`). The floor was violated in **four** rendered places, not
three; the footer fix is free.

## Decision 2 — Coarse weave period

**Choice**: page field is a **17px period with a 1.5px line, angles unchanged at
58deg/-58deg**, shipped as a **second closed utility `engraving-field`** with the
angle hoisted to `--engraving-angle` shared by both.

```css
:root { --engraving-angle: 58deg; } /* shared by card and page — same stock */

@utility engraving-field {
  background-image:
    repeating-linear-gradient(var(--engraving-angle),
      oklch(1 0 0 / 3.5%) 0 1.5px, transparent 1.5px 17px),
    repeating-linear-gradient(calc(var(--engraving-angle) * -1),
      oklch(1 0 0 / 2.5%) 0 1.5px, transparent 1.5px 17px);
}
```

`engraving` is refactored to consume `--engraving-angle`; its 7px/1px values are
untouched.

**How 17px was reasoned.**

1. *Lower bound — separation.* Page and card are seen **simultaneously** (the
   card sits inside the hero's field). The proposal's 11px is a 1.57× ratio,
   about half an octave: side by side that reads as a rendering seam, not a
   different material. A full octave or more is needed. 17/7 = 2.43×.
2. *Upper bound — it must stay a field.* At 58deg/-58deg the crossing lines form
   cells roughly 20×10px at a 17px period. Past ~24px the eye resolves
   individual cells and the texture becomes a decorative grid. 17px is the
   coarsest pitch still below that.
3. *Line weight is not free — and mean ink is the wrong metric.* Coarsening at
   1px would drop coverage from 1/7 = 14.3% to 1/17 = 5.9%, making the page
   *fainter*: the exact failure this change exists to fix. 1.5px/17px restores
   coverage to 8.8%.

   Worth being precise, because the naive number looks bad: **mean** alpha goes
   from 3.5% × 14.3% × 0.7 = 0.35% to 3.5% × 8.8% × 1.0 = 0.31% — marginally
   *lower*. That is fine, and it is the point. Perceptibility of a grating is
   driven by the **amplitude of an individual line** and its spatial frequency,
   not by mean luminance. Peak line alpha rises from 2.45% (3.5% dimmed by
   `opacity-70`) to 3.5% — **43% more local contrast** — and the 1.5px line
   survives antialiasing instead of being smeared into the ground. Meanwhile
   the 17px period sits nearer the peak of human contrast sensitivity
   (~2–5 cycles/degree at normal viewing) than the 7px period does. The page
   therefore reads as materially *more* present while carrying slightly *less*
   total ink: **fewer, heavier, wider-spaced lines** — coarse paper against the
   card's fine security print — with no risk of the two fields summing into
   grey haze.
4. *Angle is the shared constant.* Changing it would make the two fields read as
   misaligned rather than differently scaled. Pitch differs; angle does not.

**Second utility, not parameterised.** A functional `engraving-*` utility would
let any caller invent any pitch — reconstructing precisely the "any number is
expressible" failure mode `Wordmark` exists to close. Two closed utilities
sharing one angle property is the same discipline applied to texture.

**Accepted property, to be visually checked**: a 1.5px line at 1x DPR
antialiases to a soft ~2px edge; at 2x it resolves to a crisp 3 device px. The
softness at 1x is desirable (papery) and is the opposite of the card's crisp
hairline — but it must be confirmed, not assumed, at both DPRs.

**`grain` is not touched** (0.32 / `overlay`, 140px turbulence tile). It is
high-frequency noise, not a periodic grating, so there is no moiré interaction
with either pitch.

## Decision 3 — The 14px monogram

**Choice: the monogram drops the serif. The avatar stays `size-7`.**

It becomes: lowercase `w`, `font-mono` (IBM Plex Mono 500, already loaded),
`text-[0.6875rem]` (11px), flat `text-[var(--foil)]` — **not** the `text-foil`
utility.

Dropping the gradient matters as much as dropping the serif. `text-foil` is
`background-clip: text`; at 14px Instrument Serif the stems are ~0.6px, and
clipping a five-stop gradient to hairlines that thin is the most fragile mark on
the page. IBM Plex Mono 500 at 11px has ~1.3px stems and takes a flat colour.
`--foil` is 12.48:1 on ink and the avatar sits on `bg-foil/10` over `bg-ink-deep`,
so AA is comfortable. (`text-[var(--foil)]` emits `color: var(--foil)` and is not
shadowed by the `@utility text-foil` gradient, which only claims that exact name.)

**Justification against transcript density.** Mono has a large x-height, so 11px
mono is optically close to 14px serif — the avatar's visual weight is unchanged
and the session-log rhythm is untouched. Growing the avatar instead means a
≥32px glyph in a ≥44px circle: taller than two lines of the 15px body copy,
forcing `gap-3.5` and the row padding wider, and making the agent avatar
dominate the `user` and `store` avatars, which are `size-3.5` lucide icons in
the same `size-7` circle. The transcript's whole premise is an even rhythm
across three speaker kinds down a `divide-y` list. One oversized avatar breaks
it to satisfy a floor the spec already declares this variant exempt from.

## Decision 4 — `rule-mono` classification

**The rule** (apply to any future instance without asking):

> Promote to `bone-dim` if the label is an **operable control or a wayfinding
> landmark** — something the reader uses to navigate, act, or locate themselves
> in the document. Keep `bone-faint` if the label is **metadata about adjacent
> content** — something read only *after* already looking at the thing it labels.
>
> Operational test: *does removing this label leave the reader unable to get
> somewhere or do something?* Yes → structural. No, it only leaves them knowing
> less about something already visible → ambient.

Complete enumeration (`rg rule-mono src`; `index.css:72` is a comment and
`index.css:224` is the definition, both excluded):

| # | file:line | Instance | Current | Class | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | `layout/site-header.tsx:14` | "How it works" nav link | `bone-faint` | Structural | **→ `bone-dim`** |
| 2 | `layout/site-header.tsx:20` | "Request access" nav link | `bone` | Structural | Unchanged (17.37:1, already above) |
| 3 | `layout/site-footer.tsx:12` | `hello@woney.ai` mailto | `bone-faint` | Structural | **→ `bone-dim`** |
| 4 | `layout/site-footer.tsx:16` | `© {year} Woney` | `bone-faint` | Ambient | Unchanged |
| 5 | `sections/hero.tsx:24` | "Agentic payments infrastructure" eyebrow | `bone-faint` | Ambient | Unchanged |
| 6 | `sections/hero.tsx:27` | "Private beta · 2026" | `bone-faint` | Ambient | Unchanged |
| 7 | `sections/hero.tsx:76` | hero stats `<dt>` (×3) | `bone-faint` | Ambient | Unchanged |
| 8 | `sections/section-heading.tsx:18` | section index (×N) | `bone-faint` | Structural | **→ `bone-dim`** |
| 9 | `sections/capabilities.tsx:52` | card numbering "01".."06" | `bone-faint` | Ambient | Unchanged |
| 10 | `sections/audiences.tsx:28` | audience label (×2) | `foil` | Structural | Unchanged (12.48:1, already above) |
| 11 | `sections/agent-session.tsx:142` | "Agent session" panel caption | `bone-faint` | Ambient | Unchanged |
| 12 | `sections/agent-session.tsx:143` | "Daily limit $500 · $142.60 used" | `bone-faint` | Ambient | Unchanged |
| 13 | `brand/single-use-card.tsx:135` | status chip | `signal` / `bone-dim` | Ambient | Unchanged (already ≥ `bone-dim`) |
| 14 | `brand/single-use-card.tsx:157` | "Single use" | `bone-faint` | Ambient | Unchanged |
| 15 | `brand/single-use-card.tsx:183` | card `<dt>` (×3) | `bone-faint` | Ambient | Unchanged |

**Three source edits promote 5.44:1 → 8.58:1. Nothing moves down. Nothing is
below `bone-faint`.** Row 8 is a single edit that lifts every section index on
the page.

**The one genuinely close call — rows 8 vs 9.** Both are numbering. The section
index is a page-level landmark: it is the identity of the region an anchor
targets, and it is how a reader says where they are. The capability card
numbering enumerates tiles inside a grid that is already fully visible;
deleting it costs nothing navigationally. Landmark rises, enumeration does not.

**`foil` is deliberately not expanded.** The proposal floated one or two more
`foil` accents. Declined: `foil` already carries the card edge, the audience
labels, the `h1` em, and the header CTA hover. Adding a fifth use makes it the
generic label colour and flattens the accent rather than deepening the range.
Remaining separation comes from the header, the texture, and these three
promotions.

---

## Interface: the `Wordmark` component

`src/components/brand/wordmark.tsx`:

```tsx
type WordmarkVariant = 'header' | 'card' | 'monogram'

export function Wordmark({ variant }: { variant: WordmarkVariant }) { /* ... */ }
```

| Variant | Renders |
| --- | --- |
| `header` | `<span class="text-wordmark text-bone">woney</span>` + the `size-1` foil dot (moved out of `logo.tsx`) |
| `card` | `<span class="text-wordmark text-bone">woney</span>`, no dot |
| `monogram` | `<span class="font-mono text-[0.6875rem] font-medium text-[var(--foil)]">w</span>` — **intentionally not serif**, documented in source as exempt by design |

Backed by:

```css
@utility text-wordmark {
  font-family: var(--font-display);
  font-size: var(--wordmark-size);
  line-height: 1;
  letter-spacing: -0.01em;
}
```

**Why an undersized brand mark is inexpressible** — five independent closures:

1. **Closed union type.** `variant` is three string literals. `tsc -b` is a real
   gate in `bun run build`; anything else fails the build.
2. **No escape props.** No `size`, no `className`, no `style`, no `children`, no
   rest spread. There is no channel through which a Tailwind class can reach the
   element from outside. The wordmark string is a module const, so callers
   cannot pass text either.
3. **The size is not a number in the component.** `text-wordmark` reads
   `var(--wordmark-size)`. Even editing `wordmark.tsx` cannot lower the serif
   without editing the utility.
4. **`rem`, not `em`.** A parent `font-size` cannot shrink it by inheritance —
   the one hole a naive `em`-based floor would leave open.
5. **Mechanically auditable.** After migration, `rg 'font-display' src` returns
   only headings and `index.css`. A wordmark reappearing inline is one grep away.

`Logo` keeps its name and both existing call sites, becomes
`() => <Wordmark variant="header" />`, and **loses its `className` prop** (neither
call site uses it) — one more closure.

## Header composited contrast — the method

Token math is invalid under `bg-ink/80` + `backdrop-blur-xl`. The authority is
**actual composited pixels**, measured by a screenshot sweep with canvas sampling:

1. `bun run build`, serve `dist` on a fixed port.
2. `scripts/contrast-check.ts` launches
   `chrome --headless --remote-debugging-port=9222` and drives CDP over Bun's
   built-in WebSocket — **no new dependency**.
3. Per scroll position `y ∈ {0, 100, 200, 300, 400, 600}` (a sweep, rather than
   analytically guessing where the hero's `blur-3xl` radial peaks under the bar):
   `Runtime.evaluate` → `window.scrollTo(0, y)` and collect each header text
   element's `getBoundingClientRect`; then `Page.captureScreenshot`.
4. Decode by loading the base64 PNG into an `<img>` → `<canvas>` in a blank tab
   and reading `getImageData` — sample the lightest pixel inside each glyph run
   (foreground) and the darkest pixel in a ring just outside it (background).
5. Compute the WCAG ratio in the Bun script; **report the minimum across the
   whole sweep** per element. Fail under 4.5:1.
6. Failures are fixed by promoting the element's token, never by touching
   `bg-ink/80` (spec requirement).

**`bunx @axe-core/cli` is a supporting net, not the authority here.** axe derives
contrast from computed styles and cannot see through `backdrop-filter`; it will
either naively composite `rgba(ink, 0.8)` or return *incomplete* for the header.
It is run against the served build to catch regressions on the rest of the page —
particularly the three promoted instances and everything left at `bone-faint`.

## File Changes

| File | Action | Description |
| --- | --- | --- |
| `src/components/brand/wordmark.tsx` | Create | Closed-variant authority; three variants |
| `src/index.css` | Modify | `--wordmark-size`/`--header-pad-y`/`--header-h`/`--engraving-angle`; `text-wordmark`; `engraving-field`; `engraving` angle refactor; `scroll-margin-top` + rewritten comment |
| `src/components/brand/logo.tsx` | Modify | Delegates to `Wordmark`; `className` prop removed |
| `src/components/brand/single-use-card.tsx` | Modify | `:129` → `<Wordmark variant="card" />`; `:95` `engraving` unchanged |
| `src/components/sections/agent-session.tsx` | Modify | `:187` → `<Wordmark variant="monogram" />` |
| `src/components/layout/site-header.tsx` | Modify | `h-14` → `h-[var(--header-h)]`; `:14` → `text-bone-dim` |
| `src/components/layout/site-footer.tsx` | Modify | `:12` → `text-bone-dim` |
| `src/components/sections/section-heading.tsx` | Modify | `:18` → `text-bone-dim` |
| `src/components/sections/hero.tsx` | Modify | `:9` `engraving opacity-70` → `engraving-field` |
| `src/components/sections/closing-cta.tsx` | Modify | `:7` `engraving opacity-70` → `engraving-field` |
| `scripts/contrast-check.ts` | Create | CDP screenshot sweep + canvas contrast sampling |

## Prerender / hydration determinism

Every change is static CSS or static markup. No `useLayoutEffect`, no
`matchMedia`, no `window`/`document` read chooses a size, variant, or token.
CSS custom properties resolve identically server- and client-side because they
are never read by JS. The three `prefers-reduced-motion` sites
(`index.css` reduced-motion block, `use-reveal-sequence.ts:16`,
`single-use-card.tsx:43`) are untouched and must be re-confirmed post-change.

**Pre-existing hazard, explicitly not fixed here**: `site-footer.tsx:17` renders
`new Date().getFullYear()`, which can differ between prerender and hydration
across a year boundary. Adjacent to an edited line; out of scope; recorded.

## Testing Strategy

There is no test runner and none is introduced. The honest set:

| Check | Command | Covers |
| --- | --- | --- |
| Type / closed API | `bunx tsc --noEmit -p tsconfig.app.json` | Rejects any `variant` outside the union; rejects `className`/`size` on `Wordmark` and `Logo` |
| Build + prerender | `bun run build` | `tsc -b`, SSR bundle, prerender completes |
| Lint | `bunx oxlint src scripts` | Includes the new script |
| Static audit | `rg 'font-display' src` | Only headings + `index.css` remain; no inline wordmark |
| Static audit | `rg 'rule-mono' src` | Matches the 15-row table above |
| Static audit | `rg 'prefers-reduced-motion\|matchMedia\|useLayoutEffect' src` | Three motion sites intact; no client-only measurement added |
| Composited contrast | `scripts/contrast-check.ts` | Header AA over the sweep — the authority |
| Page-wide a11y | `bunx @axe-core/cli <served-url>` | Regression net outside the header; header result treated as advisory |
| Visual | Headless Chrome screenshots at DPR 1 and 2 | Wordmark ≥2rem unclipped; texture reads as material not noise; card/page pitch distinguishable; hydration console clean |

Hydration is checked by capturing the console over CDP during the same run —
the script is already attached.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file
classification, or process-integration boundary. `scripts/contrast-check.ts` is
a developer verification tool, not shipped runtime code, and takes no untrusted
input.

## Migration / Rollout

No migration. Single-commit revert restores `h-14`, `scroll-margin-top: 5.5rem`,
and the four inline wordmarks. Texture is separately revertable (`index.css`
plus two `className` strings).

## Open Questions

None blocking. Two items to confirm visually at apply time rather than decide now:

- [ ] 1.5px lines at 17px period at DPR 1 — soft-papery as intended, or mushy?
      Fallback is 1.25px at the same period, not a pitch change.
- [ ] 4.5rem header on a 375px viewport — confirm the hero's first line still
      clears the fold.
