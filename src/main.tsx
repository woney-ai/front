import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

import { App } from '@/App'
import '@/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

// hydrateRoot, not createRoot: the markup is already there from the build (see
// entry-server.tsx), so this adopts it instead of discarding it and painting
// the same tree a second time.
hydrateRoot(
  rootElement,
  <StrictMode>
    <App />
  </StrictMode>,
  {
    // React recovers from a hydration mismatch by throwing away the server
    // markup for that subtree and rendering it again on the client. The page
    // looks fine and nobody finds out. This site has no error reporting at all,
    // so the console is the only place it can surface — thin, but the
    // difference between a silent failure and a discoverable one.
    onRecoverableError: (error) => {
      console.error('hydration recovered from an error', error)
    },
  },
)
