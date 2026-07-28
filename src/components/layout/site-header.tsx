import { Logo } from '@/components/brand/logo'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" aria-label="Woney home">
          <Logo />
        </a>

        <nav className="flex items-center gap-7">
          <a
            href="#how-it-works"
            className="rule-mono hidden text-bone-faint transition-colors hover:text-bone sm:block"
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
