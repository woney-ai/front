import { ShoppingCart, User } from 'lucide-react'

import { Wordmark } from '@/components/brand/wordmark'
import { Badge } from '@/components/ui/badge'
import { useRevealSequence } from '@/hooks/use-reveal-sequence'
import { cn } from '@/lib/utils'

import { SectionHeading } from './section-heading'

/**
 * An illustrative session: buying with Woney, seen from inside a chat.
 * Sample data — no live connection.
 *
 * WHAT THIS HAS TO LOOK LIKE. An agent conversation happens in a terminal or
 * in a chat client, and neither draws pictures mid-thread. What appears there
 * is the tools the agent ran. A rendered credit card in the middle of a
 * transcript is an advertisement wedged into a conversation, not a record of
 * one — so the card is gone from here, and the tool call is back.
 *
 * It is back the way clients actually show it, though: a marker, the tool's
 * name, one line of result. Not the block of JSON arguments this once
 * printed. The arguments published a signature the product has not committed
 * to, and a rename would leave the page lying — or leave someone treating a
 * landing page as documentation. A name and a result say a tool ran and what
 * came back, which is the whole point, and stop there.
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
  | { kind: 'tool'; tool: string; result: string; status: 'done' | 'held' }

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
    kind: 'tool',
    tool: 'woney · issue_card',
    result: `northwind.shop · ${money(SPENT)} · single use`,
    status: 'done',
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
    kind: 'tool',
    tool: 'woney · issue_card',
    result: `${money(BLOCKED_AMOUNT)} · would pass your $${DAILY_LIMIT} daily limit`,
    status: 'held',
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
          <SessionBar />

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
 * The window chrome, and only that.
 *
 * A spend meter lived here for a while — a bar showing the day's total with
 * the blocked purchase spilling past the limit. It read well and it was
 * wrong: chat clients and terminals do not carry dashboards above the thread.
 * It made the frame look like a product screenshot rather than the window an
 * agent conversation actually happens in.
 *
 * The arithmetic it was there to explain is carried by the transcript itself,
 * where the refusal names the limit it would have crossed.
 */
function SessionBar() {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line bg-white/[0.02] px-5 py-3">
      <span className="rule-mono text-bone-faint">Agent session</span>
      <span className="rule-mono text-bone-faint tabular-nums">
        Daily limit ${DAILY_LIMIT}
      </span>
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

  // A tool call, the way an agent client actually renders one: a marker, the
  // tool's name, and one line of result. Not a rendered credit card — nothing
  // in a terminal or a chat app draws an object mid-conversation, and a
  // picture of the product here reads as an advertisement wedged into a
  // transcript rather than as something that happened.
  //
  // The name is shown without its arguments. It says a tool ran and what came
  // back, which is the whole point, and it stops short of publishing a
  // signature the product has not committed to yet.
  const held = entry.status === 'held'

  return (
    <div className="flex gap-3">
      <Speaker>Tool call: </Speaker>

      <span
        className={cn(
          'mt-1.5 size-1.5 shrink-0 rounded-full',
          held ? 'bg-foil' : 'bg-signal',
        )}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <code className="font-mono text-[0.8125rem] text-bone">
            {entry.tool}
          </code>
          <Badge
            variant="outline"
            className={cn(
              'rule-mono border-transparent px-1.5 py-0',
              held ? 'bg-foil/18 text-foil' : 'bg-signal/18 text-signal',
            )}
          >
            {held ? 'Needs approval' : 'Done'}
          </Badge>
        </div>

        <p className="mt-1 font-mono text-xs leading-relaxed break-words text-bone-dim tabular-nums">
          {entry.result}
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
