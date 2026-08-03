import { WaitlistForm } from '@/features/waitlist/waitlist-form'

export function ClosingCta() {
  return (
    <section className="grain relative border-t border-line">
      <div
        className="engraving-field pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-96"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 100%, oklch(0.85 0.072 82 / 9%) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-6 py-24 text-center sm:py-32">
        <h2 className="font-display text-[clamp(2.1rem,5.5vw,3.5rem)] leading-[1.02] tracking-[-0.02em] text-balance text-bone">
          Your agent already knows what to buy.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-pretty text-bone-dim">
          Give it a card that can only do what you approved — once.
        </p>

        <div className="mx-auto mt-9 max-w-md text-left">
          <WaitlistForm />
        </div>
      </div>
    </section>
  )
}
