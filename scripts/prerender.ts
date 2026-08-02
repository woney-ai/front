/**
 * Injects the build-time render into dist/index.html.
 *
 * Runs after both Vite builds: the client build produces dist/index.html with
 * its hashed asset links, the SSR build produces dist-ssr/entry-server.js, and
 * this puts the markup from the second inside the shell of the first.
 *
 * It fails loudly rather than shipping a hollow page. A silent no-op here
 * would restore the exact problem this exists to fix, and nobody would notice
 * until a crawler did.
 */

const SHELL = '<div id="root"></div>'

const indexPath = 'dist/index.html'
const html = await Bun.file(indexPath).text()

if (!html.includes(SHELL)) {
  throw new Error(
    `prerender: could not find ${SHELL} in ${indexPath}. If the shell markup ` +
      'changed, update SHELL here — otherwise this would silently ship an ' +
      'empty page.',
  )
}

const { render } = (await import('../dist-ssr/entry-server.js')) as {
  render: () => string
}

const markup = render()

if (markup.trim().length === 0) {
  throw new Error('prerender: the server render produced nothing.')
}

await Bun.write(indexPath, html.replace(SHELL, `<div id="root">${markup}</div>`))

const words = markup.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length

console.log(
  `prerender: injected ${markup.length} bytes, ~${words} words readable without JavaScript`,
)
