import { SectionHeading } from './section-heading'

const steps = [
  {
    step: '01',
    title: 'You set the mandate once',
    description:
      'Connect a funding source and define the limits: how much, at which merchants, and the threshold above which you want the final say. It covers every purchase after that.',
  },
  {
    step: '02',
    title: 'The agent builds the cart',
    description:
      'Your agent researches, compares and lands on a checkout at any ecommerce merchant — no human in the loop until it matters.',
  },
  {
    step: '03',
    title: 'Woney mints one card',
    description:
      'A virtual card issued for that single order, locked to that merchant and that amount. It dies the moment the charge clears, and we settle against your funding source.',
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
