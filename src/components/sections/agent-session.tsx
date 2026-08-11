import { ShoppingCart, User } from 'lucide-react'

import { Wordmark } from '@/components/brand/wordmark'
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message'
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
 * ONE CLAIM THIS MUST NEVER MAKE, because it is not true and is not being
 * built: Woney does not check out. The store's checkout is the same page every
 * shopper gets, and the agent works through it exactly as a person would.
 * Hence the `store` entry — that step is the one we do not do.
 *
 * There used to be a second, "Woney is not an MCP server", and it is gone
 * because it is no longer true. That line was written when the page claimed to
 * be an MCP AND to run the checkout; the checkout was the falsehood, but the
 * correction was written absolutely and outlived its reason. An MCP server and
 * a CLI are on the build path — they are surfaces onto the product, not the
 * product, which is payment infrastructure either way.
 *
 * The transcript ends on a refusal on purpose — autonomy inside the limit, a
 * stop outside it, and a way to say yes.
 */

const DAILY_LIMIT = 500
const SPENT = 142.6
const BLOCKED_AMOUNT = 399

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/**
 * `at` is the second a turn lands on, and `wait` how long the agent appears to
 * be composing before it. Both are written by hand rather than derived from
 * the index, because an even interval reads as a list animating and a
 * conversation is never even: a question comes back quickly, a decision about
 * money takes a moment.
 */
type Entry = { at: number; wait?: number } & (
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string }
  | { kind: 'store'; text: string }
  | { kind: 'tool'; tool: string; result: string; status: 'done' | 'held' }
)

const TRANSCRIPT: Entry[] = [
  {
    at: 0.1,
    kind: 'user',
    text: 'Reorder the caster wheels for my chair.',
  },
  {
    at: 0.75,
    wait: 0.5,
    kind: 'agent',
    text: 'Found them at northwind.shop — $142.60 including shipping. That is inside my limit, so I can handle it.',
  },
  {
    at: 1.15,
    kind: 'tool',
    tool: 'woney · issue_card',
    result: `northwind.shop · ${money(SPENT)} · single use`,
    status: 'done',
  },
  {
    at: 1.55,
    kind: 'store',
    text: 'Checking out at northwind.shop.',
  },
  {
    at: 2.1,
    wait: 0.42,
    kind: 'agent',
    text: 'Ordered, arriving Thursday.',
  },
  {
    at: 2.6,
    kind: 'user',
    text: 'Great. Add the standing desk mat too.',
  },
  // The amount alone is under the limit. What goes over is the amount plus
  // what today already spent — saying so is what makes the example legible,
  // and it is the moment the product is worth the most.
  {
    at: 3.05,
    kind: 'tool',
    tool: 'woney · issue_card',
    result: `${money(BLOCKED_AMOUNT)} · would pass your $${DAILY_LIMIT} daily limit`,
    status: 'held',
  },
  // The longest pause on the page, and the only one that is deliberate. This
  // is the turn where the agent has to tell you no.
  {
    at: 3.7,
    wait: 0.6,
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
          title="One purchase goes through. One does not."
        >
          {/* This was "The card, not the checkout." — an internal correction
              (we do not run the checkout) promoted to a headline. It answers a
              question the reader has not asked yet, and can only be understood
              after learning what we do NOT do.

              It also buried the best thing in the section. The transcript is
              the only place on the page where the product says no, and the
              title now promises exactly that: two attempts, not one, so the
              refusal reads as the design working rather than as a failure.

              What the old title carried is not lost — the store row inside the
              transcript and "Nothing changes on the store's side" in step two
              both make the point where it belongs. */}
          Here is the whole thing, from inside a chat with your agent.
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
            className="flex flex-col gap-3 px-4 py-5 sm:gap-3.5 sm:px-6 sm:py-6"
            data-sequenced={started || undefined}
          >
            {TRANSCRIPT.map((entry, index) => (
              <li
                key={index}
                className="relative"
                style={
                  {
                    '--at': entry.at,
                    '--wait': entry.wait ?? 0.5,
                  } as React.CSSProperties
                }
              >
                <TranscriptEntry entry={entry} />
              </li>
            ))}
          </ol>
        </div>

        {/* No caption. "Sample identifiers and amounts" told the reader
            something the lead above already establishes — this is what a
            session looks like — and northwind.shop is not a claim anyone will
            mistake for a real order of theirs. */}
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
        Daily limit {`$${DAILY_LIMIT}`}
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

/**
 * The pause before an answer, made visible.
 *
 * Absolutely positioned so it occupies no space: the reply beneath it is
 * already in the layout, merely transparent, so nothing moves when the dots
 * hand over. Hidden entirely without JavaScript and under reduced motion,
 * where the transcript is simply all there and nothing should pretend to be
 * in progress.
 */
function TypingDots() {
  return (
    <span className="chat-typing absolute top-1 left-10 flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-bone-faint"
          style={{
            animation: 'typing-dot 1.05s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  )
}

function TranscriptEntry({ entry }: { entry: Entry }) {
  // What you say, what the agent answers and what actually happens are three
  // different kinds of thing. They used to share one treatment and read as a
  // flat list. Now speech has a side, and events have none — they are not
  // anyone's turn.
  if (entry.kind === 'user') {
    return (
      <Message align="end" className="chat-step">
        <Speaker>You said: </Speaker>
        <MessageAvatar className="size-7 self-start border border-line bg-white/[0.04]">
          <User className="size-3.5 text-bone-dim" aria-hidden />
        </MessageAvatar>
        <MessageContent className="max-w-[85%] sm:max-w-[70%]">
          {/* w-fit and self-end because MessageContent is full width and its
              own end-alignment rule only reaches children carrying a
              data-slot. Without these the bubble stretches to the cap instead
              of hugging its text, which is the one thing a chat bubble has to
              do. */}
          <p className="w-fit self-end rounded-xl rounded-br-sm bg-surface px-4 py-2.5 text-[0.9375rem] leading-relaxed text-bone">
            {entry.text}
          </p>
        </MessageContent>
      </Message>
    )
  }

  if (entry.kind === 'agent') {
    return (
      <>
        {/* Sits where the reply will be and is gone by the time it lands. Out
            of the flow, so nothing shifts when it goes. */}
        <TypingDots />

        <Message className="chat-step">
          <Speaker>Your agent said: </Speaker>
          <MessageAvatar className="size-7 self-start border border-foil/30 bg-foil/10">
            <Wordmark variant="monogram" />
          </MessageAvatar>
          <MessageContent className="max-w-[85%] sm:max-w-[70%]">
            <p className="pt-1 text-[0.9375rem] leading-relaxed text-bone-dim">
              {entry.text}
            </p>
          </MessageContent>
        </Message>
      </>
    )
  }

  // The agent working the merchant's own checkout. Deliberately the plainest
  // row on the page: this is the step Woney does not perform, so nothing here
  // should look like a capability of ours.
  if (entry.kind === 'store') {
    return (
      <Message className="chat-step">
        <Speaker>At the store: </Speaker>
        <MessageAvatar className="size-7 self-start border border-line bg-white/[0.04]">
          <ShoppingCart className="size-3.5 text-bone-faint" aria-hidden />
        </MessageAvatar>
        <MessageContent className="max-w-[85%] sm:max-w-[70%]">
          <p className="pt-1 text-[0.9375rem] leading-relaxed text-bone-faint italic">
            {entry.text}
          </p>
        </MessageContent>
      </Message>
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
    <div className="chat-step flex gap-3">
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
