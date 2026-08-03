/**
 * Sole authority for how the Woney wordmark/monogram is rendered. The API is
 * closed on purpose: `variant` is the only prop. There is no `size`,
 * `className`, `style`, `children`, or rest-spread — no channel through which
 * a caller can express a sub-floor serif instance or otherwise reach the
 * rendered element. The size itself is not a number in this file; it is
 * `var(--wordmark-size)` in `text-wordmark` (`src/index.css`), defined in
 * `rem` so a parent `font-size` cannot shrink it by inheritance either.
 *
 * `monogram` is the one variant that is intentionally NOT serif — see
 * design.md Decision 3. It stays exempt from the floor by design, not by
 * omission: dropping the gradient and the serif at 11px avoids the most
 * fragile mark on the page (a five-stop gradient clipped to sub-pixel serif
 * stems), while IBM Plex Mono's larger x-height keeps its optical weight
 * close to a 14px serif `w`.
 */

const WORDMARK = 'woney'

type WordmarkVariant = 'header' | 'card' | 'monogram'

export function Wordmark({ variant }: { variant: WordmarkVariant }) {
  if (variant === 'monogram') {
    return (
      <span className="font-mono text-[0.6875rem] font-medium text-[var(--foil)]">
        w
      </span>
    )
  }

  if (variant === 'header') {
    return (
      <span className="flex items-baseline gap-2">
        <span className="text-wordmark text-bone">{WORDMARK}</span>
        <span className="h-1 w-1 rounded-full bg-foil" aria-hidden />
      </span>
    )
  }

  return <span className="text-wordmark text-bone">{WORDMARK}</span>
}
