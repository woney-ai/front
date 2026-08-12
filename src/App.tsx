import { Analytics } from '@vercel/analytics/react'

import { ErrorBoundary } from '@/components/error-boundary'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { AgentSession } from '@/components/sections/agent-session'
import { Capabilities } from '@/components/sections/capabilities'
import { ClosingCta } from '@/components/sections/closing-cta'
import { Hero } from '@/components/sections/hero'
import { HowItWorks } from '@/components/sections/how-it-works'

export function App() {
  return (
    <div className="min-h-dvh bg-ink">
      {/* First thing in the tab order, invisible until it has focus. Without
          it a keyboard or screen-reader user walks the header on every visit
          before reaching anything they came for. */}
      <a href="#main" className="skip-link font-mono text-sm">
        Skip to content
      </a>

      {/* Wrapping the sections rather than the whole tree: the header and the
          footer carry the only two ways to reach us, so a section that throws
          should not take the address with it. */}
      <SiteHeader />
      <ErrorBoundary>
        <main id="main">
          <Hero />
          <HowItWorks />
          <AgentSession />
          <Capabilities />
          <ClosingCta />
        </main>
      </ErrorBoundary>
      <SiteFooter />

      {/* Cookieless, so no consent banner stands between a visitor and the
          form. It exists for one number: how many arrived versus how many
          signed up. The signups themselves already carry their own source. */}
      <Analytics />
    </div>
  )
}
