import { Check, CornerDownRight, ShieldAlert, User, X } from 'lucide-react'

import { useRevealSequence } from '@/hooks/use-reveal-sequence'
import { cn } from '@/lib/utils'

import { SectionHeading } from './section-heading'

/**
 * An illustrative MCP session: what buying through Woney looks like from
 * inside an agent, against a mandate the user already granted when they
 * connected their funding source. Sample data — no live connection.
 *
 * The transcript deliberately ends on a decline: autonomy inside the
 * mandate, a hard stop outside it.
 */

type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string }
  | {
      kind: 'tool'
      tool: string
      args: Record<string, string | number>
      status: 'ok' | 'declined'
      result: string
    }

const TRANSCRIPT: Entry[] = [
  {
    kind: 'user',
    text: 'Reorder the caster wheels for my chair.',
  },
  {
    kind: 'agent',
    text: 'Found them at northwind.shop — $142.60 including shipping. That fits your mandate, so I can handle it.',
  },
  {
    kind: 'tool',
    tool: 'woney.issue_card',
    args: {
      mandate: 'mnd_a8f3',
      merchant: 'northwind.shop',
      amount: 142.6,
    },
    status: 'ok',
    result: 'card_4408 · single use · locked to northwind.shop',
  },
  {
    kind: 'tool',
    tool: 'woney.checkout',
    args: { card: 'card_4408', cart: 'nw_cart_91b2' },
    status: 'ok',
    result: 'order NW-77301 confirmed · card_4408 is now void',
  },
  {
    kind: 'agent',
    text: 'Ordered, arriving Thursday. The card that paid for it no longer exists.',
  },
  {
    kind: 'user',
    text: 'Great. Add the standing desk mat too.',
  },
  {
    kind: 'tool',
    tool: 'woney.issue_card',
    args: {
      mandate: 'mnd_a8f3',
      merchant: 'northwind.shop',
      amount: 399.0,
    },
    status: 'declined',
    result: 'declined · over the $150 per-purchase limit · approval requested',
  },
  {
    kind: 'agent',
    text: "That one is above your limit, so I can't issue a card for it. I sent it to your phone to approve.",
  },
]

function formatArgs(args: Record<string, string | number>): string {
  const body = Object.entries(args)
    .map(([key, value]) => {
      if (typeof value !== 'number') return `${key}: "${value}"`
      // Money always carries its minor units, the way a real API would.
      return `${key}: ${key.includes('amount') ? value.toFixed(2) : value}`
    })
    .join(', ')

  return `{ ${body} }`
}

export function AgentSession() {
  const { ref, revealed } = useRevealSequence(TRANSCRIPT.length)

  return (
    <section id="agent-session" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading index="In the agent" title="One tool call away.">
          Woney is an MCP server, so checkout stops being a browser automation
          problem and becomes something your agent can simply call — against
          the mandate you already granted, and never outside it.
        </SectionHeading>

        <div
          ref={ref}
          className="mt-12 overflow-hidden rounded-xl border border-line bg-ink-deep shadow-[0_40px_80px_-40px_oklch(0_0_0/80%)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-white/[0.02] px-5 py-3">
            <span className="rule-mono text-bone-faint">Agent session</span>
            <span className="rule-mono flex items-center gap-2 text-bone-faint">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden />
              Mandate mnd_a8f3 · active
            </span>
          </div>

          <ol className="divide-y divide-line">
            {TRANSCRIPT.slice(0, revealed).map((entry, index) => (
              <li key={index} className="animate-rise px-5 py-4 sm:px-7 sm:py-5">
                <TranscriptEntry entry={entry} />
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-5 text-center text-[0.8125rem] text-bone-faint">
          Illustrative session. Sample identifiers and amounts.
        </p>
      </div>
    </section>
  )
}

function TranscriptEntry({ entry }: { entry: Entry }) {
  if (entry.kind === 'user') {
    return (
      <div className="flex gap-3.5">
        <Avatar>
          <User className="size-3.5 text-bone-dim" aria-hidden />
        </Avatar>
        <p className="pt-0.5 text-[0.9375rem] leading-relaxed text-bone">
          {entry.text}
        </p>
      </div>
    )
  }

  if (entry.kind === 'agent') {
    return (
      <div className="flex gap-3.5">
        <Avatar className="border-foil/30 bg-foil/10">
          <span className="font-display text-sm leading-none text-foil">w</span>
        </Avatar>
        <p className="pt-0.5 text-[0.9375rem] leading-relaxed text-bone-dim">
          {entry.text}
        </p>
      </div>
    )
  }

  const declined = entry.status === 'declined'

  return (
    <div className="flex gap-3.5">
      <Avatar
        className={cn(declined && 'border-destructive/35 bg-destructive/10')}
      >
        {declined ? (
          <ShieldAlert className="size-3.5 text-destructive" aria-hidden />
        ) : (
          <CornerDownRight className="size-3.5 text-bone-faint" aria-hidden />
        )}
      </Avatar>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-mono text-sm text-bone">
          <span className="text-bone-faint">call </span>
          {entry.tool}
        </p>

        <pre className="mt-2 rounded-md border border-line bg-black/25 px-3 py-2 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-bone-dim">
          {formatArgs(entry.args)}
        </pre>

        <p
          className={cn(
            'mt-2 flex items-start gap-2 font-mono text-xs',
            declined ? 'text-destructive' : 'text-signal',
          )}
        >
          {declined ? (
            <X className="mt-px size-3.5 shrink-0" aria-hidden />
          ) : (
            <Check className="mt-px size-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 break-words">{entry.result}</span>
        </p>
      </div>
    </div>
  )
}

function Avatar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04]',
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  )
}
