import { SectionHeading } from './section-heading'

const capabilities = [
  {
    title: 'One card, one purchase',
    description:
      'Every checkout gets a freshly minted card that expires with the transaction. A leaked number is already worthless.',
  },
  {
    title: 'Amount locked at issuance',
    description:
      'The card is minted for the exact cart total. An agent that hallucinates a bigger order gets a decline, not a charge.',
  },
  {
    title: 'Merchant locked',
    description:
      'Each card only works at the store it was issued for. Anywhere else, the transaction never authorizes.',
  },
  {
    title: 'Approval only when it matters',
    description:
      'Under your limit the agent just buys. Over it, no card is issued and the decision comes to you — the only moment you are asked for one.',
  },
  {
    title: 'Structured receipts',
    description:
      'Machine-readable line items back to your agent, human-readable history back to you.',
  },
  {
    title: 'Full audit trail',
    description:
      'Who asked, what the agent decided, which card paid for it — for every single checkout.',
  },
]

export function Capabilities() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading index="Controls" title="The card is the control.">
          Handing a model your card number is not a payments strategy. Woney
          moves the limits into the card itself, where the network enforces them
          — not into a prompt the agent can talk its way around.
        </SectionHeading>

        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ title, description }, index) => (
            <div
              key={title}
              className="group relative bg-ink p-7 transition-colors duration-300 hover:bg-surface"
            >
              <span className="rule-mono text-bone-faint tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3.5 text-[1.0625rem] font-semibold tracking-[-0.01em] text-bone">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                {description}
              </p>
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-foil/50 transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
