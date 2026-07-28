import { useEffect, useRef, useState } from 'react'

/**
 * Reveals `total` items one at a time, but only once the element has actually
 * scrolled into view — so the transcript plays for the reader instead of
 * finishing while they are still up in the hero.
 */
export function useRevealSequence(total: number, stepMs = 460) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(total)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(1)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [total])

  useEffect(() => {
    if (revealed === 0 || revealed >= total) return

    const timer = window.setTimeout(() => setRevealed((n) => n + 1), stepMs)
    return () => window.clearTimeout(timer)
  }, [revealed, total, stepMs])

  return { ref, revealed, done: revealed >= total }
}
