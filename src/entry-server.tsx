import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'

import { App } from '@/App'

/**
 * Build-time render, so the HTML we serve is not an empty div.
 *
 * The page is a client-rendered SPA, which means a crawler that does not
 * execute JavaScript sees no content at all. For a product that exists so
 * agents can buy things, being unreadable to the systems those agents run on
 * is a poor look and a real cost.
 *
 * This is safe to render on a server because nothing in the tree touches the
 * DOM while rendering — `window` appears only inside effects and inside the
 * form's submit handler, and every piece of state starts from a constant.
 * That determinism is what lets the client hydrate this markup instead of
 * throwing it away. If you ever compute state from `Math.random()`, `Date`, or
 * anything read off `window` during render, hydration will mismatch and this
 * stops being free.
 *
 * Note this deliberately does NOT import `index.css`: stylesheets are the
 * client bundle's business, and the CSS link is already in index.html.
 */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
