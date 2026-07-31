import {
  Check,
  CornerDownRight,
  ShieldAlert,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'

import { useRevealSequence } from '@/hooks/use-reveal-sequence'
import { cn } from '@/lib/utils'

import { SectionHeading } from './section-heading'

/**
 * An illustrative session: what buying with Woney looks like from inside an
 * agent, against a mandate the user granted when they connected their funding
 * source. Sample data — no live connection.
 *
 * Two things this transcript must never imply, because neither is true:
 *
 *   Woney is not an MCP server. It is payment infrastructure. The agent asks
 *   it for a card; how the agent reaches it is the agent's business.
 *
 *   Woney does not check out. There is no `woney.checkout`, and inventing one
 *   would sell a capability that does not exist. The merchant's checkout is
 *   the same page every shopper gets, and the agent works through it exactly
 *   as a person would — unless that merchant has built something to help,
 *   which is theirs, not ours. Hence the `store` step: it is the agent
 *   labouring at a normal checkout, with no Woney in the loop.
 *
 * The transcript deliberately ends on a decline: autonomy inside the
 * mandate, a hard stop outside it.
 */

type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string }
  | { kind: 'store'; text: string; detail: string }
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
    kind: 'store',
    text: "Filling in northwind.shop's checkout — the same one any shopper gets.",
    detail: 'standard merchant checkout · card_4408 · no Woney in the loop',
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
        <SectionHeading index="In the agent" title="The card, not the checkout.">
          Your agent still does the buying. It works through the merchant's
          checkout the way a person would, because that is the same checkout
          everyone gets and we do not sit inside it. What the agent never gets
          is your card. It asks for one that works once, at one store, for one
          amount, inside the mandate you already granted.
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

  // The agent working the merchant's own checkout. Rendered plainly on
  // purpose: no call signature, no arguments, nothing that could be mistaken
  // for something Woney provides. This step is the part we do not do.
  if (entry.kind === 'store') {
    return (
      <div className="flex gap-3.5">
        <Avatar>
          <ShoppingCart className="size-3.5 text-bone-faint" aria-hidden />
        </Avatar>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[0.9375rem] leading-relaxed text-bone-dim">
            {entry.text}
          </p>
          <p className="mt-2 font-mono text-xs text-bone-faint">
            {entry.detail}
          </p>
        </div>
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
