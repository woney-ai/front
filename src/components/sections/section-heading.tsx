import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function SectionHeading({
  index,
  title,
  children,
  className,
}: {
  index: string
  title: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('max-w-xl', className)}>
      <span className="rule-mono text-bone-dim">{index}</span>

      <h2 className="mt-4 font-display text-[clamp(2.35rem,4.6vw,3.1rem)] leading-[1.04] tracking-[-0.015em] text-balance text-bone">
        {title}
      </h2>

      {children && (
        <p className="mt-4 leading-relaxed text-pretty text-bone-dim">
          {children}
        </p>
      )}
    </div>
  )
}
