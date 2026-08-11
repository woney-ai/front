import { useEffect, useState } from 'react'

import { Wordmark } from '@/components/brand/wordmark'
import { cn } from '@/lib/utils'

/**
 * The hero artifact: an illustrative virtual card running the real lifecycle
 * of a Woney credential — minted against a held amount, capped, authorized
 * once, then spent. Numbers here are sample data.
 *
 * The terminal phase is `spent`, not `expired`, and the distinction is the
 * backend's: `CardStatus` has both `USED` and `EXPIRED`, and they mean opposite
 * things. A card that reaches `authorized` and dies was USED — it did its job.
 * EXPIRED is the card nobody ever used, timed out by the TTL worker, which is
 * still being built. This sequence tells the successful story, so it must not
 * borrow the name of the abandoned one. `Spent` also completes the arc the
 * first phase opens: minted, locked, authorized, spent — the life of a coin.
 *
 * The merchant shown is captured data — today `intended_merchant` is recorded
 * and forwarded, and binding the card to it is on the MVP build path.
 *
 * The line this codebase draws, and it is the owner's: WHAT IS NEVER ALLOWED
 * IS A CAPABILITY NOBODY INTENDS TO BUILD. Everything on this page describes
 * the product being built, which is what a pre-launch page is for.
 *
 * This rule used to read "prose outside the artifacts states only what ships
 * today". That was written assuming parts had already shipped. Nothing has —
 * the backend is still being built — so taken literally it would forbid the
 * entire page. The distinction that survives is intent, not shipping date.
 *
 * What the page owes in exchange is that its stage is unmistakable, to a
 * person and to a machine. The visible copy says "Private beta", "Request
 * access" and "Access opens in batches"; the JSON-LD says the product is not
 * yet generally available. A model quoting one of those without the other
 * would otherwise report a live product, and that correction cannot be made
 * after the fact.
 */

type Phase = 'minting' | 'locked' | 'authorized' | 'spent'

const PHASE_ORDER: Phase[] = ['minting', 'locked', 'authorized', 'spent']

const PHASE_DURATION: Record<Phase, number> = {
  minting: 1500,
  locked: 1700,
  authorized: 2400,
  spent: 1900,
}

const SAMPLE_NUMBER = '5412 7799 0031 4408'
const SCRAMBLE_CHARS = '0123456789'

/**
 * What the card says it is doing, in the reader's words rather than ours.
 *
 * The internal phase names stay as they are — they are ours, and renaming them
 * would say nothing. What ships is this map, and it was leaking: extracted as
 * text the card announced "Minting", which is the same vocabulary the rest of
 * the page spent a day removing, on the one surface written for machines to
 * read.
 */
const STATUS_LABEL: Record<Phase, string> = {
  minting: 'Creating',
  locked: 'Locked to one store',
  authorized: 'Paid',
  spent: 'No longer works',
}

function scramble(template: string): string {
  return template.replace(/\d/g, () =>
    SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * SCRAMBLE_CHARS.length)),
  )
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function SingleUseCard({ className }: { className?: string }) {
  const [phase, setPhase] = useState<Phase>('minting')
  const [digits, setDigits] = useState(SAMPLE_NUMBER)

  // Advance the lifecycle. Reduced motion holds the card in its resting,
  // most informative state instead of looping.
  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('authorized')
      return
    }

    const timer = window.setTimeout(() => {
      const next =
        PHASE_ORDER[(PHASE_ORDER.indexOf(phase) + 1) % PHASE_ORDER.length]
      setPhase(next)
    }, PHASE_DURATION[phase])

    return () => window.clearTimeout(timer)
  }, [phase])

  // Digits churn only while the card is being minted, then lock in.
  useEffect(() => {
    if (phase !== 'minting') {
      setDigits(SAMPLE_NUMBER)
      return
    }

    const ticker = window.setInterval(
      () => setDigits(scramble(SAMPLE_NUMBER)),
      55,
    )

    return () => window.clearInterval(ticker)
  }, [phase])

  const isDead = phase === 'spent'
  const isAuthorized = phase === 'authorized'

  return (
    <figure
      className={cn('w-full max-w-[29rem] select-none', className)}
      aria-label="Illustration of a Woney single-use card being minted against a held amount, capped to that amount, authorized once, then spent and void."
    >
      <div className="relative" style={{ perspective: '1400px' }} aria-hidden>
        <div
          className={cn(
            // The proportion is a floor, not a cage. It used to be
            // `aspect-[1.586]` alone, which fixes the height from the width and
            // then clips whatever does not fit, because the face is
            // `overflow-hidden` for the foil edge and the sheen.
            //
            // At 375px that left about six pixels of slack for the whole
            // content column. It survived here and did not on iPhone, where
            // Safari and Brave both cut the bottom row off — the amount and the
            // use count, which are the two figures the card exists to show. Any
            // platform whose font metrics round differently would have done the
            // same; the layout was one pixel of bad luck from breaking
            // anywhere.
            //
            // `min-h` keeps the credit-card shape when the content fits and
            // lets the card grow a little when it does not, so nothing is ever
            // cut. Padding and the digits also start smaller and step up at
            // `sm`, which buys the room back on the widths where it was tight.
            'relative flex min-h-[min(58vw,18.5rem)] overflow-hidden rounded-[1.15rem] p-5 transition-all duration-700 ease-out sm:aspect-[1.586] sm:min-h-0 sm:p-7',
            // The face is a background-COLOR, not a gradient, and that is both
            // the finish and a bug fix.
            //
            // It previously carried `bg-gradient-to-br from/via/to`, which set
            // `background-image` — the same property `engraving` sets. The
            // utility won the cascade and the face gradient never rendered at
            // all. What looked like a card surface was the page showing
            // through, plus the engraving lines, plus the shadow and foil edge.
            // Editing those colour stops changed nothing, which is how this
            // was found.
            //
            // Matte is the right answer to that anyway. What reads as plastic
            // is specular VARIANCE, not darkness: the dead gradient swept 0.27
            // to 0.15, and a ramp that wide is how gloss behaves under a light.
            // A flat fill has no ramp at all, so the face absorbs instead of
            // reflecting — which is why premium cards are finished this way.
            // The engraving now carries the surface, as a matte material
            // should: legible by texture rather than by highlight.
            'engraving',
            // Live: the 1px inset highlight was the specular edge and it goes.
            // The foil bloom warms and the drop shadow deepens, because against
            // a matte face the foil is the only thing left catching light.
            //
            // Spent: a spent card does not turn transparent, it stops being
            // lit. `opacity-50` made the page's coarse weave show straight
            // through the face and the object stopped reading as material at
            // all — the one thing the matte finish exists to establish. So the
            // face stays fully opaque and simply goes dark and colourless, the
            // foil bloom is extinguished, and the shadow shortens because a
            // card lying dead sits closer to the surface than one being held up
            // to the light.
            isDead
              ? 'bg-[oklch(0.16_0.005_265)] saturate-0 shadow-[0_26px_50px_-30px_oklch(0_0_0/90%)]'
              : 'bg-[oklch(0.205_0.015_265)] shadow-[0_0_70px_-10px_oklch(0.85_0.072_82/18%),0_54px_100px_-30px_oklch(0_0_0/98%)]',
          )}
          style={{
            transform: isDead
              ? 'rotateX(9deg) rotateY(-14deg) translateY(10px) scale(0.97)'
              : 'rotateX(7deg) rotateY(-11deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Foil edge */}
          <span
            className="pointer-events-none absolute inset-0 rounded-[1.1rem] p-px"
            style={{
              background:
                'linear-gradient(140deg, oklch(0.93 0.07 88 / 85%), oklch(1 0 0 / 8%) 32%, oklch(1 0 0 / 5%) 62%, oklch(0.8 0.09 62 / 65%))',
              WebkitMask:
                'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Foil sweep, fired on authorization */}
          {isAuthorized && (
            <span
              // Wider and weaker than it was. A matte surface still catches
              // light on authorization, but it scatters it — a tight bright
              // band would put the gloss straight back on the face.
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/6 to-transparent"
              style={{ animation: 'foil-sweep 1.1s ease-out' }}
            />
          )}

          {/* `flex-1`, not `h-full`. A percentage height only resolves against a
              definite one: with the proportion it had one, and switching the
              small screens to `min-height` made it automatic — so `h-full`
              became `auto`, the column stopped stretching, and
              `justify-between` had nothing to distribute. The bottom row rose
              to meet the middle and left dead space under it. Fixing the
              clipping introduced that; this makes the column fill whatever
              height the face ended up with, either way. */}
          <div className="relative flex flex-1 flex-col justify-between">
            <div className="flex items-start justify-between">
              <Wordmark variant="card" />

              <span
                className={cn(
                  'rule-mono flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors duration-500',
                  isAuthorized
                    ? 'border-signal/40 bg-signal/10 text-signal'
                    : 'border-line bg-white/[0.04] text-bone-dim',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    isAuthorized ? 'bg-signal' : 'bg-bone-faint',
                  )}
                  style={
                    phase === 'minting'
                      ? { animation: 'pulse-signal 1s ease-in-out infinite' }
                      : undefined
                  }
                />
                {STATUS_LABEL[phase]}
              </span>
            </div>

            <div>
              <span className="rule-mono text-bone-faint">Single use</span>
              <p
                className={cn(
                  'mt-1.5 font-mono text-[1.08rem] tracking-[0.06em] tabular-nums transition-colors duration-500 sm:text-[1.45rem] sm:tracking-[0.08em]',
                  isDead ? 'text-bone-faint line-through' : 'text-bone',
                )}
              >
                {digits}
              </p>
            </div>

            <dl className="grid grid-cols-[1.4fr_1fr_auto] gap-3 sm:gap-4">
              {[
                // The merchant is real captured data: `intended_merchant` is
                // stored on the card row and sent to the provider, and binding
                // the card to it is on the MVP build path.
                //
                // This note used to forbid prose saying the card is locked to
                // that merchant "until the enforcement ships", which made sense
                // when parts of the product were assumed to be live. Nothing is
                // — the backend is still being built — so the same rule would
                // forbid every sentence on the page. See the header comment for
                // the line that survives: intent, not shipping date.
                { term: 'Store', value: 'northwind.shop' },
                { term: 'Amount', value: '$142.60' },
                { term: 'Uses', value: isDead ? '1 / 1' : '0 / 1' },
              ].map(({ term, value }) => (
                <div key={term} className="min-w-0">
                  <dt className="rule-mono text-bone-faint">{term}</dt>
                  <dd className="mt-1 truncate font-mono text-[0.8125rem] text-bone-dim tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Cancellation seal, stamped the moment the card dies */}
        {isDead && (
          <span
            className="animate-seal pointer-events-none absolute top-1/2 -right-3 -translate-y-1/2 rotate-[-11deg] rounded border-2 border-destructive/55 px-3 py-1 font-mono text-[0.6875rem] tracking-[0.22em] text-destructive/85 uppercase sm:-right-7"
            style={{ animationDelay: '0.05s' }}
          >
            Void
          </span>
        )}
      </div>

      <figcaption className="mt-6 flex items-center gap-2.5 text-[0.8125rem] text-bone-faint">
        <span className="h-px flex-1 bg-line" />
        One card, one store, one amount, one use.
        <span className="h-px flex-1 bg-line" />
      </figcaption>
    </figure>
  )
}
