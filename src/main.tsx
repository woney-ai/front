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
)
