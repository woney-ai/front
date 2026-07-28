import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { AgentSession } from '@/components/sections/agent-session'
import { Audiences } from '@/components/sections/audiences'
import { Capabilities } from '@/components/sections/capabilities'
import { ClosingCta } from '@/components/sections/closing-cta'
import { Hero } from '@/components/sections/hero'
import { HowItWorks } from '@/components/sections/how-it-works'

export function App() {
  return (
    <div className="min-h-dvh bg-ink">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <AgentSession />
        <Capabilities />
        <Audiences />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  )
}
