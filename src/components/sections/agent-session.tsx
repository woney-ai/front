import { ShieldAlert, ShoppingCart, User } from 'lucide-react'

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

const DAILY_LIMIT = 500
const SPENT = 142.6
const BLOCKED_AMOUNT = 399

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string }
  | { kind: 'store'; text: string }
  | { kind: 'card'; merchant: string; amount: number; last4: string }
  | { kind: 'blocked'; amount: number; reason: string }

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
    kind: 'card',
    merchant: 'northwind.shop',
    amount: SPENT,
    last4: '4408',
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
    kind: 'blocked',
    amount: BLOCKED_AMOUNT,
    reason: 'would take you past your $500 daily limit',
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
          <SpendMeter />

          {/* Every entry is always rendered. The stagger is CSS, driven off
              `data-sequenced`, so the transcript exists in the prerendered HTML
              and for anyone without JavaScript. It used to be sliced by a
              counter that is zero on the server, which hid this entire section
              from exactly the machines it was written for. */}
          <ol
            aria-label="Example session between a person and their agent"
            aria-describedby="session-note"
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

        {/* Referenced by the list's aria-describedby, so "these are made-up
            figures" reaches a screen reader before the numbers do rather than
            arriving as an afterthought below them. */}
        <p
          id="session-note"
          className="mt-5 text-center text-[0.8125rem] text-bone-faint"
        >
          Sample identifiers and amounts.
        </p>
      </div>
    </section>
  )
}

/**
 * The day's spending, drawn.
 *
 * The header used to say "Daily limit $500 · $142.60 used" and leave the
 * reader to do the arithmetic that makes the refusal below make sense. Drawn,
 * the whole argument is one glance: this much is gone, that much is left, and
 * the purchase the agent is about to ask for does not fit in the gap.
 */
function SpendMeter() {
  // The bar is the limit. What the blocked purchase needed beyond it is drawn
  // past the end, spilling — the geometry makes the argument before the words
  // do. Widths are scaled so the bar plus the spill fill the row, which keeps
  // the bar an honest 100% of the limit rather than silently compressing to
  // fit an overflow inside itself.
  const spentPct = (SPENT / DAILY_LIMIT) * 100
  const fitsPct = 100 - spentPct
  const overPct = ((SPENT + BLOCKED_AMOUNT - DAILY_LIMIT) / DAILY_LIMIT) * 100
  const barShare = 100 / (100 + overPct)

  return (
    <div className="border-b border-line bg-white/[0.02] px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="rule-mono text-bone-faint">Agent session</span>
        <span className="rule-mono text-bone-dim tabular-nums">
          {money(SPENT)} of ${DAILY_LIMIT} today
        </span>
      </div>

      <div className="mt-2.5 flex h-1.5 items-stretch gap-[3px]" aria-hidden>
        <div
          className="flex overflow-hidden rounded-full bg-white/[0.06]"
          style={{ width: `${barShare * 100}%` }}
        >
          {/* Spent, then the room still left — which is exactly the room the
              next purchase did not fit into. */}
          <span className="bg-foil" style={{ width: `${spentPct}%` }} />
          <span className="bg-foil/20" style={{ width: `${fitsPct}%` }} />
        </div>

        <span className="flex-1 rounded-full bg-[repeating-linear-gradient(115deg,oklch(0.72_0.15_25/70%)_0_2px,transparent_2px_5px)]" />
      </div>
    </div>
  )
}

/**
 * Who is speaking, for anyone not reading with their eyes.
 *
 * Left and right, avatars and colour carried the whole answer to "who said
 * this", and every one of those cues is visual. Extracted as text, the
 * transcript ran together into one voice — and a page written to be legible
 * to the machines agents run on was, in the section that demonstrates the
 * product, illegible to them.
 */
function Speaker({ children }: { children: string }) {
  return <span className="sr-only">{children}</span>
}

function TranscriptEntry({ entry }: { entry: Entry }) {
  // What you say, what the agent answers and what actually happens are three
  // different kinds of thing. They used to share one treatment and read as a
  // flat list. Now speech has a side, and events have none — they are not
  // anyone's turn.
  if (entry.kind === 'user') {
    return (
      <div className="flex justify-end gap-3">
        <Speaker>You said: </Speaker>
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
        <Speaker>Your agent said: </Speaker>
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
        <Speaker>At the store: </Speaker>
        <Avatar>
          <ShoppingCart className="size-3.5 text-bone-faint" aria-hidden />
        </Avatar>
        <p className="max-w-[85%] pt-1 text-[0.9375rem] leading-relaxed text-bone-faint italic sm:max-w-[70%]">
          {entry.text}
        </p>
      </div>
    )
  }

  // The card, drawn rather than described. The product's whole argument is an
  // object — a card that exists for one purchase — and the demo was spending
  // its strongest moment on a line of text. Same face as the hero card: matte
  // black, foil hairline, engraved field.
  if (entry.kind === 'card') {
    return (
      <div className="flex justify-center py-1">
        <Speaker>Woney created a card: </Speaker>

        <figure className="engraving w-full max-w-[21rem] rounded-xl bg-[oklch(0.205_0.015_265)] p-4 shadow-[0_0_40px_-16px_oklch(0.85_0.072_82/22%),0_20px_40px_-18px_oklch(0_0_0/95%)] ring-1 ring-foil/20">
          <figcaption className="flex items-baseline justify-between">
            <Wordmark variant="card" />
            <span className="rule-mono text-foil/80">Single use</span>
          </figcaption>

          <p className="mt-4 font-mono text-[0.9375rem] text-bone tabular-nums">
            <span className="text-bone-faint">•••• •••• •••• </span>
            {entry.last4}
          </p>

          <dl className="mt-4 grid grid-cols-[1.5fr_1fr_auto] gap-3 border-t border-foil/12 pt-3">
            {[
              ['Merchant', entry.merchant],
              ['Amount', money(entry.amount)],
              ['Uses', '0 / 1'],
            ].map(([term, value]) => (
              <div key={term} className="min-w-0">
                <dt className="rule-mono text-bone-faint">{term}</dt>
                <dd className="mt-1 truncate font-mono text-[0.8125rem] text-bone-dim tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </figure>
      </div>
    )
  }

  // And its opposite: the shape of the card that was not made. An outline with
  // nothing inside says "no card exists for this" in a way no sentence does —
  // and it is the same idea the mark is built on, a thing defined by absence.
  //
  // Not red. Nothing failed here: the limit held and there is a way to say
  // yes. The label and the icon carry the meaning, so it never rests on a
  // colour some readers cannot separate.
  return (
    <div className="flex justify-center py-1">
      <Speaker>Woney did not create a card: </Speaker>

      <div className="w-full max-w-[21rem] rounded-xl border border-dashed border-foil/30 bg-transparent p-4 text-center">
        <ShieldAlert className="mx-auto size-4 text-foil/70" aria-hidden />

        <p className="mt-2.5 text-sm font-semibold tracking-[-0.01em] text-bone">
          No card created
        </p>
        <p className="mt-1 font-mono text-xs leading-relaxed text-bone-dim tabular-nums">
          {money(entry.amount)} {entry.reason}
        </p>

        <p className="rule-mono mt-3 border-t border-foil/12 pt-3 text-foil/80">
          Waiting for your approval
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
