import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * The hero artifact: an illustrative virtual card running the real lifecycle
 * of a Woney credential — minted against a held amount, capped, authorized
 * once, then dead. Numbers here are sample data.
 *
 * The merchant shown is captured data, not an enforced restriction — today
 * `intended_merchant` is recorded and forwarded, and binding the card to it is
 * on the MVP path. Displaying it is fine and deliberate. Prose asserting the
 * card is locked to that merchant is not, until the enforcement ships.
 */

type Phase = 'minting' | 'locked' | 'authorized' | 'expired'

const PHASE_ORDER: Phase[] = ['minting', 'locked', 'authorized', 'expired']

const PHASE_DURATION: Record<Phase, number> = {
  minting: 1500,
  locked: 1700,
  authorized: 2400,
  expired: 1900,
}

const SAMPLE_NUMBER = '5412 7799 0031 4408'
const SCRAMBLE_CHARS = '0123456789'

const STATUS_LABEL: Record<Phase, string> = {
  minting: 'Minting',
  locked: 'Locked',
  authorized: 'Authorized',
  expired: 'Expired',
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

  const isDead = phase === 'expired'
  const isAuthorized = phase === 'authorized'

  return (
    <figure
      className={cn('w-full max-w-[29rem] select-none', className)}
      aria-label="Illustration of a Woney single-use card being minted against a held amount, capped to that amount, authorized once, then expiring."
    >
      <div className="relative" style={{ perspective: '1400px' }} aria-hidden>
        <div
          className={cn(
            'relative aspect-[1.586] overflow-hidden rounded-[1.15rem] p-7 transition-all duration-700 ease-out',
            'engraving bg-gradient-to-br from-[oklch(0.27_0.017_265)] via-[oklch(0.2_0.015_265)] to-[oklch(0.15_0.014_265)]',
            'shadow-[0_1px_0_0_oklch(1_0_0/14%)_inset,0_0_60px_-12px_oklch(0.85_0.072_82/14%),0_50px_90px_-32px_oklch(0_0_0/95%)]',
            isDead && 'opacity-50 saturate-0',
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
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/14 to-transparent"
              style={{ animation: 'foil-sweep 1.1s ease-out' }}
            />
          )}

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-display text-xl leading-none tracking-tight text-bone">
                woney
              </span>

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
                  'mt-1.5 font-mono text-[1.32rem] tracking-[0.08em] tabular-nums transition-colors duration-500 sm:text-[1.45rem]',
                  isDead ? 'text-bone-faint line-through' : 'text-bone',
                )}
              >
                {digits}
              </p>
            </div>

            <dl className="grid grid-cols-[1.4fr_1fr_auto] gap-4">
              {[
                // The merchant is real captured data: `intended_merchant` is
                // stored on the card row and sent to the provider. Showing it
                // is honest and it is where the product is heading — binding
                // the card to that merchant is on the MVP path.
                //
                // What it is not yet is an enforced restriction. Keep it as a
                // field on the card; do not write prose that says the card is
                // locked to it until the enforcement ships.
                { term: 'Merchant', value: 'northwind.shop' },
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
        One card, one merchant, one amount, one use.
        <span className="h-px flex-1 bg-line" />
      </figcaption>
    </figure>
  )
}
