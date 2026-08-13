import { SingleUseCard } from '@/components/brand/single-use-card'
import { WaitlistForm } from '@/features/waitlist/waitlist-form'

export function Hero() {
  return (
    <section id="waitlist" className="grain relative overflow-hidden">
      {/* Engraved field + a single light source, high and left of the card */}
      <div
        className="engraving-field pointer-events-none absolute inset-0"
        aria-hidden
      />
      {/* No blur filter, deliberately. A radial gradient is already a soft
          edge; putting a 64px blur on top of one adds almost nothing you can
          see. At a phone's 3x density this 736px square rasterises to
          2208x2208, which is ~19MB of RGBA for a single buffer, and a blur is
          not a single buffer — it reads a padded source region and writes
          through intermediate passes, so the real cost is a small multiple of
          that, re-paid as the element scrolls. That is the kind of weight that
          gets a tab killed, and a killed tab is what a reload loop looks like
          from the outside. The closing section has always drawn its glow this
          way and reads correctly. */}
      <div
        className="pointer-events-none absolute -top-64 right-[-10%] h-[46rem] w-[46rem] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, oklch(0.85 0.072 82 / 11%) 0%, transparent 72%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Document header rule — this is a financial instrument, not a blog */}
        <div className="animate-rise flex items-center justify-between border-b border-line py-4">
          <span className="rule-mono text-bone-faint">
            Agentic payments infrastructure
          </span>
          <span className="rule-mono hidden text-bone-faint sm:inline">
            Private beta · 2026
          </span>
        </div>

        <div className="grid items-center gap-14 pt-14 pb-20 lg:grid-cols-12 lg:gap-6 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-7 lg:pr-8">
            <h1
              className="animate-rise font-display text-[clamp(3rem,8.5vw,5.75rem)] leading-[0.92] tracking-[-0.02em] text-bone"
              style={{ animationDelay: '0.08s' }}
            >
              Agents can shop.
              <br />
              <em className="text-foil italic">They can&rsquo;t pay.</em>
            </h1>

            <p
              // A lead, not body copy. The jump from a 92px display face
              // straight to 18px left the eye with nowhere to land; 21px is the
              // missing step, and it is the only paragraph on the page that
              // gets it.
              //
              // It opens on the moment rather than on us. The headline states a
              // problem, and this used to answer with "Woney closes that gap",
              // which spent the most valuable position on the page repeating
              // the sentence above it — and only landed for a reader who
              // already delegates purchases and has felt the stop. Almost
              // nobody has yet. Showing the stop happening is what lets the
              // headline mean something to everyone else.
              //
              // It also ends on a fact instead of "it handles the rest". In a
              // product that touches money, "the rest" is precisely what the
              // reader needs said out loud.
              className="animate-rise mt-7 max-w-xl text-[1.3125rem] leading-[1.6] text-pretty text-bone-dim"
              style={{ animationDelay: '0.16s' }}
            >
              Your agent finds it, compares sellers, picks one — and then{' '}
              <span className="text-bone">
                stops, because paying means your card
              </span>
              . Woney gives it a card of its own: yours never moves, and it can
              only spend what you allowed.
            </p>

            <div
              // max-w-xl to match the lead above it. Three different left-column
              // widths read as drift, not rhythm — and the input was too narrow
              // for an address anyone actually owns.
              className="animate-rise mt-9 max-w-xl"
              style={{ animationDelay: '0.24s' }}
            >
              <WaitlistForm />
            </div>

            <dl
              className="animate-rise mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-7"
              style={{ animationDelay: '0.32s' }}
            >
              {[
                // Three product facts, scanned rather than read. This row used
                // to end on "Access · Rolling batches", which is waitlist
                // logistics sitting in a line otherwise about what the thing
                // does — and the form directly above already says access opens
                // in batches.
                //
                // What replaces it is the one fact a developer comes looking
                // for and could not find anywhere on the page. It belongs here
                // and not in the prose: "MCP" means nothing to the reader who
                // just delegates purchases, and everything to the one deciding
                // whether to build against us.
                { term: 'Merchant integration', value: 'None required' },
                { term: 'Card reuse', value: 'Impossible by design' },
                { term: 'Agent access', value: 'MCP and CLI' },
              ].map(({ term, value }) => (
                <div key={term}>
                  <dt className="rule-mono text-bone-faint">{term}</dt>
                  <dd className="mt-1.5 text-sm text-bone">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            className="animate-rise lg:col-span-5 lg:-mt-12 lg:-mr-14"
            style={{ animationDelay: '0.4s' }}
          >
            <SingleUseCard className="mx-auto lg:mr-0 lg:ml-auto" />
          </div>
        </div>
      </div>
    </section>
  )
}
