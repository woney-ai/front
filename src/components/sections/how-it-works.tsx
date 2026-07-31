import { SectionHeading } from './section-heading'

const steps = [
  {
    step: '01',
    title: 'You authorize once',
    description:
      'Connect a funding source and give each agent a daily limit. That standing authorization covers every purchase after it — you are not approving carts one by one.',
  },
  {
    step: '02',
    title: 'The agent does the shopping',
    description:
      'It researches, compares and reaches a checkout anywhere online. The same checkout you would use, because nothing here asks the merchant to integrate with us.',
  },
  {
    step: '03',
    title: 'Woney issues one card',
    description:
      'A card that exists for that one purchase and nothing else: one merchant, one amount, one transaction. Your funding source settles it, and the number is worthless the moment it clears.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-ink-deep">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading index="How it works" title="Three moves. One card.">
          Your real card never leaves your account, and the agent never touches
          a number it can spend twice.
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
