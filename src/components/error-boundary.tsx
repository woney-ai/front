import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Stops a render error from turning the page black.
 *
 * There was no boundary at all, and the consequence is specific: when React
 * cannot render, it unmounts the whole tree, `#root` is left empty, and the
 * body's background is near-black. The visitor gets an unexplained black
 * screen with no way to tell whether the site is broken or their connection
 * is — which is exactly what was reported from Android Chrome.
 *
 * This does not fix whatever throws. It makes the failure legible, and leaves
 * the reader somewhere to go. A blank page tells them nothing and loses them;
 * a sentence and an address does not.
 *
 * Scope worth knowing: a boundary catches errors thrown while RENDERING. It
 * does not catch them inside event handlers — the waitlist submit already has
 * its own try/catch for that — nor inside async callbacks. So this covers the
 * path that produces the black screen and not much else, which is the point.
 */

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The site has no error reporting service, so the console is the only
    // place this can surface. Thin, but the difference between a failure
    // somebody can diagnose and one nobody can.
    console.error('render failed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="flex min-h-dvh items-center justify-center bg-ink px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-3xl leading-tight text-bone">
            Something broke on our side.
          </p>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
            Reloading usually fixes it. If it does not, write to{' '}
            <a
              href="mailto:hello@woney.ai"
              className="text-bone underline underline-offset-4"
            >
              hello@woney.ai
            </a>{' '}
            and we will add you to the list by hand.
          </p>
        </div>
      </main>
    )
  }
}
