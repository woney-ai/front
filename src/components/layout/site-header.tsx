import { Logo } from '@/components/brand/logo'

export function SiteHeader() {
  return (
    // A backdrop filter re-samples everything behind it on every scroll frame,
    // which is the most expensive thing a sticky element can do on a phone.
    // Below sm the bar is opaque instead, so there is nothing to sample; from
    // sm up the translucency and the blur come back.
    <header className="sticky top-0 z-50 border-b border-line bg-ink sm:bg-ink/80 sm:backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between px-6">
        <a href="/" aria-label="Woney home">
          <Logo />
        </a>

        <nav className="flex items-center gap-7">
          <a
            href="#how-it-works"
            className="rule-mono hidden text-bone-dim transition-colors hover:text-bone sm:block"
          >
            How it works
          </a>
          <a
            href="#waitlist"
            className="rule-mono text-bone transition-colors hover:text-foil"
          >
            Request access
          </a>
        </nav>
      </div>
    </header>
  )
}
