import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-baseline gap-2', className)}>
      <span className="font-display text-[1.375rem] leading-none tracking-tight text-bone">
        woney
      </span>
      <span
        className="h-1 w-1 rounded-full bg-foil"
        aria-hidden
      />
    </span>
  )
}
