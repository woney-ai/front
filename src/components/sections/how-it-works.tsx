import { SectionHeading } from './section-heading'

/**
 * The three steps of using Woney, in plain language.
 *
 * This section explains how the product is used. That is its whole job, so it
 * is written to be understood on one read: short sentences, ordinary words,
 * no metaphors and no figures of speech that ask the reader to look twice.
 *
 * Two rules earned the hard way, both from drafts that were rejected:
 *
 *   Say what the reader gets, never how we build it. "Connect a funding
 *   source", "standing authorization" and "nothing asks the merchant to
 *   integrate with us" all described our side of the counter. A reader does
 *   not care that no integration is required; they care that it works at the
 *   store they are already on.
 *
 *   Keep the language courteous. An earlier draft closed on "that number is
 *   dead". It is vivid and it is wrong for a product people trust with money.
 */
const steps = [
  {
    step: '01',
    title: 'Set a limit',
    description:
      'You decide how much your agent can spend. It works freely inside that limit, so you are not asked to approve every purchase.',
  },
  {
    step: '02',
    title: 'Your agent shops',
    description:
      'It searches, compares and pays at any online store, the same way you would. Nothing changes on the store’s side.',
  },
  {
    step: '03',
    title: 'One card per purchase',
    description:
      'Each purchase gets its own card, for one store and one amount. Once the payment goes through, the card stops working.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-ink-deep">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading index="How it works" title="Three moves. One card.">
          {/* The hook has one job: answer the question the reader arrives with
              — does my card end up in the agent's hands — and hand over the
              title. "One card" in the heading above means nothing until this
              line explains it, and the steps below read differently once it
              has. The previous version said the same thing in twice the words
              and asked the reader to unpack "a number it can spend twice". */}
          You keep your card. Your agent gets a new one for every purchase.
        </SectionHeading>

        <ol className="mt-14 grid gap-y-10 sm:grid-cols-3 sm:gap-x-10">
          {steps.map(({ step, title, description }) => (
            <li key={step} className="border-t border-line pt-6">
              <span className="font-mono text-sm text-foil tabular-nums">
                {step}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-bone">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-bone-dim">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
