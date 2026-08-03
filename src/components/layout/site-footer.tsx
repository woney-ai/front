import { Logo } from '@/components/brand/logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-9 sm:flex-row sm:items-center sm:justify-between">
        <Logo />

        <div className="flex items-center gap-7">
          <a
            href="mailto:hello@woney.ai"
            className="rule-mono text-bone-dim transition-colors hover:text-bone"
          >
            hello@woney.ai
          </a>
          {/* A fixed year, not `new Date().getFullYear()`. The build
              prerenders, so a live year is evaluated once at build time, baked
              into the static HTML, and then recomputed by the client on every
              load — which means every visit after 1 January is a hydration
              mismatch until someone redeploys. A copyright notice is also just
              the year of publication; it does not need to track the calendar. */}
          <span className="rule-mono text-bone-faint">© 2026 Woney</span>
        </div>
      </div>
    </footer>
  )
}
