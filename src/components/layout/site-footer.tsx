import { Logo } from '@/components/brand/logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-9 sm:flex-row sm:items-center sm:justify-between">
        <Logo />

        <div className="flex items-center gap-7">
          <a
            href="mailto:hello@woney.ai"
            className="rule-mono text-bone-faint transition-colors hover:text-bone"
          >
            hello@woney.ai
          </a>
          <span className="rule-mono text-bone-faint">
            © {new Date().getFullYear()} Woney
          </span>
        </div>
      </div>
    </footer>
  )
}
