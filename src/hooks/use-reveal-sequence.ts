import { useEffect, useRef, useState } from 'react'

/**
 * Staggers a list into view once the element has scrolled to, so the transcript
 * plays for the reader instead of finishing while they are still in the hero.
 *
 * It returns a boolean, not a count, and that is the whole design. The previous
 * version returned how many items to show and the caller sliced its array by
 * it — which meant the server rendered ZERO of them. The entire transcript was
 * missing from the prerendered HTML, so the one section that explains the
 * product to a machine was invisible to any crawler that does not run
 * JavaScript, which is exactly what the prerender exists to prevent.
 *
 * Now every item is always in the DOM and CSS does the staggering. Content is
 * never hostage to an animation.
 *
 * `started` is false on the server and on the client's first render, so the two
 * agree and there is nothing to hydrate wrong. Only an effect turns it true,
 * which also means no-JS leaves every item plainly visible — the behaviour that
 * matters most here.
 */
export function useRevealSequence() {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Reduced motion never starts the sequence: the items simply stay as they
    // already are, which is visible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, started }
}
