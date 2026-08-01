const audiences = [
  {
    label: 'For agent builders',
    title: 'A card on request',
    points: [
      'One request returns a usable card number, capped and short-lived.',
      'Deterministic declines your agent can actually recover from.',
      'Your users never hand their real card number to a model.',
    ],
  },
  {
    label: 'For merchants',
    title: 'A new class of buyer',
    points: [
      'It settles on the card rails you already accept — zero checkout changes.',
      'Every card is backed by a human who authorized the spend in advance.',
      'Single-use numbers mean nothing worth stealing sits in your order data.',
    ],
  },
]

export function Audiences() {
  return (
    <section className="border-t border-line bg-ink-deep">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 md:grid-cols-2 md:gap-16">
        {audiences.map(({ label, title, points }) => (
          <div key={label}>
            <span className="rule-mono text-foil">{label}</span>

            {/* h2, not h3. This section has no heading above these two, so an
                h3 would file them under the previous section's h2 — a screen
                reader would announce them as part of Capabilities. */}
            <h2 className="mt-4 font-display text-[clamp(2.05rem,3.6vw,2.5rem)] leading-[1.06] tracking-[-0.015em] text-bone">
              {title}
            </h2>

            <ul className="mt-7 space-y-0">
              {points.map((point) => (
                <li
                  key={point}
                  className="border-t border-line py-4 text-sm leading-relaxed text-bone-dim last:border-b"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
