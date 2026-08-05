import { CreditCard, ShieldAlert, ShoppingCart, User } from 'lucide-react'

import { Wordmark } from '@/components/brand/wordmark'
import { useRevealSequence } from '@/hooks/use-reveal-sequence'
import { cn } from '@/lib/utils'

import { SectionHeading } from './section-heading'

/**
 * An illustrative session: buying with Woney, seen from inside a chat.
 * Sample data — no live connection.
 *
 * WHY THERE IS NO FUNCTION CALL HERE ANY MORE. This used to print
 * `woney.issue_card` with a block of JSON arguments. Three things were wrong
 * with that. It published an API surface that is not public yet, so a rename
 * would leave the page lying — or worse, leave someone treating a landing
 * page as documentation. It exposed how the product works inside, which is
 * not for before launch. And the audience is both agent developers and people
 * who delegate purchases to an assistant: the call signature gains a little
 * with the first group and loses the second entirely, because code on a page
 * reads as "not for me".
 *
 * What replaced it says the same thing as an event: the card appearing, with
 * the store, the amount and the single use all still visible. Nothing
 * persuasive was lost — the exact figures and the refusal are what convince.
 *
 * Two claims this must never make, because neither is true:
 *
 *   Woney is not an MCP server. It is payment infrastructure. How the agent
 *   reaches it is the agent's business.
 *
 *   Woney does not check out. The merchant's checkout is the same page every
 *   shopper gets, and the agent works through it exactly as a person would.
 *   Hence the `store` entry: that step is the one we do not do.
 *
 * The transcript ends on a refusal on purpose — autonomy inside the limit, a
 * stop outside it, and a way to say yes.
 */

type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string }
  | { kind: 'store'; text: string }
  | {
      kind: 'event'
      status: 'issued' | 'blocked'
      label: string
      detail: string
    }

const TRANSCRIPT: Entry[] = [
  {
    kind: 'user',
    text: 'Reorder the caster wheels for my chair.',
  },
  {
    kind: 'agent',
    text: 'Found them at northwind.shop — $142.60 including shipping. That is inside my limit, so I can handle it.',
  },
  {
    kind: 'event',
    status: 'issued',
    label: 'Card created',
    detail: 'northwind.shop · $142.60 · one use',
  },
  {
    kind: 'store',
    text: 'Checking out at northwind.shop, like any other customer.',
  },
  {
    kind: 'agent',
    text: 'Ordered, arriving Thursday. That card does not work anymore.',
  },
  {
    kind: 'user',
    text: 'Great. Add the standing desk mat too.',
  },
  // The amount alone is under the limit. What goes over is the amount plus
  // what today already spent — saying so is what makes the example legible,
  // and it is the moment the product is worth the most.
  {
    kind: 'event',
    status: 'blocked',
    label: 'Needs your approval',
    detail: '$399.00 would take you past your $500 daily limit',
  },
  {
    kind: 'agent',
    text: 'That would take you past your daily limit, so I have not bought it. I sent you a request — approve it and I will place the order.',
  },
]

export function AgentSession() {
  const { ref, started } = useRevealSequence()

  return (
    <section id="agent-session" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading
          index="In the agent"
          title="The card, not the checkout."
        >
          {/* The two sections above already argued the case. This one only has
              to show it, so the lead points at the transcript instead of
              restating what the reader just read. */}
          Here is what that looks like inside a chat with your agent.
        </SectionHeading>

        <div
          ref={ref}
          className="mt-12 overflow-hidden rounded-xl border border-line bg-ink-deep shadow-[0_40px_80px_-40px_oklch(0_0_0/80%)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-white/[0.02] px-5 py-3">
            <span className="rule-mono text-bone-faint">Agent session</span>
            <span className="rule-mono flex items-center gap-2 text-bone-faint">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden />
              Daily limit $500 · $142.60 used
            </span>
          </div>

          {/* Every entry is always rendered. The stagger is CSS, driven off
              `data-sequenced`, so the transcript exists in the prerendered HTML
              and for anyone without JavaScript. It used to be sliced by a
              counter that is zero on the server, which hid this entire section
              from exactly the machines it was written for. */}
          <ol
            className="flex flex-col gap-3 px-4 py-5 sm:gap-3.5 sm:px-6 sm:py-6"
            data-sequenced={started || undefined}
          >
            {TRANSCRIPT.map((entry, index) => (
              <li
                key={index}
                className="reveal-step"
                style={{ '--step': index } as React.CSSProperties}
              >
                <TranscriptEntry entry={entry} />
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-5 text-center text-[0.8125rem] text-bone-faint">
          Sample identifiers and amounts.
        </p>
      </div>
    </section>
  )
}

function TranscriptEntry({ entry }: { entry: Entry }) {
  // What you say, what the agent answers and what actually happens are three
  // different kinds of thing. They used to share one treatment and read as a
  // flat list. Now speech has a side, and events have none — they are not
  // anyone's turn.
  if (entry.kind === 'user') {
    return (
      <div className="flex justify-end gap-3">
        <p className="max-w-[85%] rounded-xl rounded-br-sm bg-surface px-4 py-2.5 text-[0.9375rem] leading-relaxed text-bone sm:max-w-[70%]">
          {entry.text}
        </p>
        <Avatar>
          <User className="size-3.5 text-bone-dim" aria-hidden />
        </Avatar>
      </div>
    )
  }

  if (entry.kind === 'agent') {
    return (
      <div className="flex gap-3">
        <Avatar className="border-foil/30 bg-foil/10">
          <Wordmark variant="monogram" />
        </Avatar>
        <p className="max-w-[85%] pt-1 text-[0.9375rem] leading-relaxed text-bone-dim sm:max-w-[70%]">
          {entry.text}
        </p>
      </div>
    )
  }

  // The agent working the merchant's own checkout. Deliberately the plainest
  // row on the page: this is the step Woney does not perform, so nothing here
  // should look like a capability of ours.
  if (entry.kind === 'store') {
    return (
      <div className="flex gap-3">
        <Avatar>
          <ShoppingCart className="size-3.5 text-bone-faint" aria-hidden />
        </Avatar>
        <p className="max-w-[85%] pt-1 text-[0.9375rem] leading-relaxed text-bone-faint italic sm:max-w-[70%]">
          {entry.text}
        </p>
      </div>
    )
  }

  const blocked = entry.status === 'blocked'

  // Not speech. Full width, inset, and railed in foil or in the alarm colour —
  // an instrument reading, not a turn in the conversation.
  return (
    <div
      className={cn(
        'flex items-center gap-3.5 rounded-lg border border-l-2 bg-black/25 px-4 py-3',
        blocked
          ? 'border-line border-l-destructive'
          : 'border-line border-l-foil',
      )}
    >
      {blocked ? (
        <ShieldAlert className="size-4 shrink-0 text-destructive" aria-hidden />
      ) : (
        <CreditCard className="size-4 shrink-0 text-foil" aria-hidden />
      )}

      <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
        <span
          className={cn(
            'block text-sm font-semibold tracking-[-0.01em]',
            blocked ? 'text-destructive' : 'text-bone',
          )}
        >
          {entry.label}
        </span>
        <span className="mt-1 block font-mono text-xs leading-relaxed break-words text-bone-dim sm:mt-0">
          {entry.detail}
        </span>
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
