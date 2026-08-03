# Exploration — landing-visual-identity

Investigation only. No implementation decided here.

## The reported problem

The owner's words: the text does not look good, especially the logo and the
navbar; the contrasts feel off; the page "lacks character".

## Findings

### 1. The wordmark is below the typeface's floor — in three places, not one

Instrument Serif is weight-400-only and very high contrast. An earlier session
established that it stops holding together below roughly 2rem. Every heading on
the page respects that floor — `hero.tsx:35`, `section-heading.tsx:20`,
`audiences.tsx:33`, `closing-cta.tsx:20`. Every brand mark violates it:

| Location | Size |
| --- | --- |
| `logo.tsx:6` | 22px |
| `single-use-card.tsx:129` | 20px |
| `agent-session.tsx:187` | 14px monogram |

Enlarging the header 3x shows the stems visibly breaking up.

**The root cause is not the sizes. It is that the floor exists nowhere
enforceable** — no token, no comment at the point of use, no lint rule. It was
discovered once, written into memory, and violated anyway. A fix that only
corrects the three numbers will be undone a fourth time.

### 2. Page-level texture is near-invisible — but that is the documented intent

`@utility engraving` (`index.css:161-173`) draws hairlines at 3.5% and 2.5%
white. `hero.tsx:9` and `closing-cta.tsx:7` apply it with `opacity-70`, so the
effective strength is roughly 2.4% and 1.7% — at the edge of perceptibility.

It is applied at **full strength** on `single-use-card.tsx:95`, which matches
the design language: texture concentrates on the card, the page stays quiet.

So the code implements the stated hierarchy correctly. The problem is that at
the page level, "deliberately restrained" and "accidentally invisible" look
identical. Changing this is a design decision, not a bug fix.

`grain` (0.32 opacity, `mix-blend-mode: overlay`) contributes more perceptually
than `engraving` does.

### 3. The tonal band is flat

Measured against `--ink`:

| Token | Ratio |
| --- | --- |
| bone | 17.37:1 |
| foil | 12.48:1 |
| bone-dim | 8.58:1 |
| bone-faint | 5.44:1 |

Only two elements on the entire page leave the 5.44–8.58 band: the `h1` and the
filled waitlist button (`waitlist-form.tsx:111`). `rule-mono` in `bone-faint` is
the single most repeated treatment on the page — 13+ instances across header,
footer, hero, section headings, card and capabilities.

## Approaches for the header

The header is `h-14`, sticky, `backdrop-blur-xl`.

1. **Grow the header** so a ≥2rem wordmark fits. One consistent mark
   everywhere. Costs a coupled edit: `scroll-margin-top` is 5.5rem and its
   comment ties it explicitly to the current header height (`index.css:126-131`).
2. **A distinct compact lockup for the header** — e.g. the monogram pattern.
   No layout change, but a second brand mark to keep in sync.
3. **Drop the serif in the header only.** Free in layout terms; undercuts the
   design language at its most visible touchpoint.
4. Fix only the card and monogram. Does not address the report.

## Constraints

- WCAG AA must not regress. `bone-faint` sits at exactly 5.44:1 and a prior
  value of 4.25:1 was already rejected for this reason. Effective contrast has
  to be checked after `bg-ink/80` + `backdrop-blur-xl` compositing, not just
  token-to-token.
- `prefers-reduced-motion` is honored in exactly three places: `index.css:134`,
  `use-reveal-sequence.ts:16`, `single-use-card.tsx:43`.
- The build prerenders then hydrates, so nothing may depend on client-only
  measurement — the first render must stay deterministic.

## Risks

- The undocumented floor recurs a fourth time unless the fix encodes the
  constraint structurally rather than correcting three numbers.
- Changing header height has follow-on layout effects beyond the logo.
- Engraving and grain strength is a subjective call. It needs an explicit
  decision, not a "turn it up".

## Out of scope

Copy, product claims, anything about what the page says.
