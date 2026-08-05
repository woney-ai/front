import { SectionHeading } from './section-heading'

/**
 * Why the product can be trusted, said without a vocabulary lesson.
 *
 * The claims here are unchanged — the same six controls, the same promises.
 * What changed is that they are now in ordinary English. The previous copy
 * spoke fluent payments and fluent AI, and expected the reader to as well:
 * "at issuance", "gets a decline", "never authorizes", "hallucinates",
 * "machine-readable line items", and a card that was twice "minted".
 *
 * Someone deciding whether to trust us with money should not have to learn
 * our vocabulary first. Every term a reader would have to look up is a reason
 * to close the tab.
 */
const capabilities = [
  {
    title: 'One card, one purchase',
    description:
      'Every purchase gets its own card, and it stops working once that purchase is paid. Even if the number is copied, it cannot be used again.',
  },
  {
    title: 'Set to the exact amount',
    description:
      'The card is created for the exact total of that purchase. It cannot be charged for more, even by mistake.',
  },
  {
    title: 'Works at one store only',
    description:
      'Each card only works at the store it was created for. Anywhere else, the payment does not go through.',
  },
  {
    title: 'Approval only when it matters',
    description:
      'Under your limit, your agent buys on its own. Over it, the purchase waits for you.',
  },
  {
    title: 'A receipt for every purchase',
    description:
      'Your agent gets the details it needs to keep track. You get a history you can actually read.',
  },
  {
    title: 'You can see everything',
    description:
      'Who asked for it, what your agent decided, and which card paid — for every purchase.',
  },
]

export function Capabilities() {
  // Deep ground, matching How it works. The page alternates flat and deep so
  // each section reads as its own plate; removing the audiences section left
  // this one and the transcript above it sharing a ground, which collapsed
  // two sections into a single long field.
  return (
    <section className="border-t border-line bg-ink-deep">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading index="Controls" title="The card is the control.">
          {/* The whole argument for the product, in two sentences. The version
              this replaces made the same point by explaining where enforcement
              happens — which is our plumbing, and not something a reader
              should need in order to feel safe. */}
          Your agent is not asked to behave. The limits live in the card itself,
          so there is nothing for it to get wrong.
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
