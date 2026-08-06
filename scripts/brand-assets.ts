/**
 * Renders the social assets from the brand mark.
 *
 *   bun run brand:assets
 *
 * Writes into `brand/`, which is committed: these files get uploaded by hand
 * to LinkedIn and X, so they need to exist somewhere a person can find them
 * rather than being regenerated from memory each time someone asks.
 *
 * Sizes are the platforms' own, and the safe areas are why the compositions
 * are not centred:
 *
 *   LinkedIn company cover is 1128x191, and the page's logo tile sits over the
 *   lower left of it. Anything in that corner is covered.
 *
 *   X header is 1500x500, and the avatar overlaps the lower left there too.
 *
 * Both are also cropped differently on mobile, so nothing load-bearing goes
 * near an edge.
 */

const OUT = new URL('../brand/', import.meta.url)

const INK_DEEP = '#03050a'
const BONE = '#f3f0e8'
const BONE_DIM = '#a7abb3'
const FOIL = '#e5ca98'

const mark = await Bun.file(new URL('mark-foil.svg', OUT)).text()

/** The engraved field from the site, at the period the page uses. */
const engraving = `
  background:
    radial-gradient(120% 140% at 50% 0%, oklch(0.26 0.02 265 / 60%) 0%, transparent 65%),
    repeating-linear-gradient(58deg, transparent 0 16px, oklch(0.85 0.072 82 / 5%) 16px 17.5px),
    repeating-linear-gradient(-58deg, transparent 0 16px, oklch(0.85 0.072 82 / 4%) 16px 17.5px),
    ${INK_DEEP};
`

const FONT_FILES = {
  'Instrument Serif': new URL(
    '../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2',
    import.meta.url,
  ),
  'IBM Plex Mono': new URL(
    '../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
    import.meta.url,
  ),
}

const fonts = Object.entries(FONT_FILES)
  .map(
    ([family, url]) =>
      `@font-face { font-family: '${family}'; src: url('${url}') format('woff2'); }`,
  )
  .join('\n  ')

type Asset = { name: string; width: number; height: number; body: string }

const ASSETS: Asset[] = [
  // Three avatars, because the right one depends on how the account is used
  // and that is not a decision a script should make. All square: every
  // platform crops to a circle, so nothing sits where a circle would clip it.
  {
    // The mark. Most distinctive, and the only one that survives being small.
    name: 'avatar-mark',
    width: 800,
    height: 800,
    body: `<div style="${engraving};width:800px;height:800px;display:flex;align-items:center;justify-content:center;">
      <div style="width:520px;height:520px;">${mark}</div>
    </div>`,
  },
  {
    // The name. Legible at profile size, illegible in a comment thread — which
    // is where an avatar spends most of its life.
    name: 'avatar-wordmark',
    width: 800,
    height: 800,
    body: `<div style="${engraving};width:800px;height:800px;display:flex;align-items:center;justify-content:center;">
      <div style="font-family:'Instrument Serif',serif;font-size:190px;line-height:1;color:${BONE};letter-spacing:-0.015em;">Woney<span style="color:${FOIL};">.</span></div>
    </div>`,
  },
  {
    // The initial, set in the brand's own face, with the foil stop that is the
    // one piece of the identity that reads at any size.
    name: 'avatar-monogram',
    width: 800,
    height: 800,
    body: `<div style="${engraving};width:800px;height:800px;display:flex;align-items:center;justify-content:center;">
      <div style="font-family:'Instrument Serif',serif;font-size:440px;line-height:1;color:${BONE};transform:translateY(-14px);">W<span style="color:${FOIL};">.</span></div>
    </div>`,
  },
  {
    name: 'linkedin-cover',
    width: 1128,
    height: 191,
    body: `<div style="${engraving};width:1128px;height:191px;display:flex;align-items:center;justify-content:flex-end;padding:0 56px 0 300px;">
      <div style="text-align:right;">
        <div style="font-family:'Instrument Serif',serif;font-size:44px;line-height:1;color:${BONE};">Agents can shop. <em style="color:${FOIL};font-style:italic;">They can’t pay.</em></div>
        <div style="margin-top:12px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${BONE_DIM};">woney.ai &nbsp;·&nbsp; Agentic payments infrastructure</div>
      </div>
    </div>`,
  },
  {
    name: 'x-header',
    width: 1500,
    height: 500,
    body: `<div style="${engraving};width:1500px;height:500px;display:flex;align-items:center;justify-content:space-between;padding:0 90px 0 110px;">
      <div>
        <div style="font-family:'Instrument Serif',serif;font-size:76px;line-height:1.06;color:${BONE};">Agents can shop.<br /><em style="color:${FOIL};font-style:italic;">They can’t pay.</em></div>
        <div style="margin-top:26px;font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:0.2em;text-transform:uppercase;color:${BONE_DIM};">woney.ai &nbsp;·&nbsp; Agentic payments infrastructure</div>
      </div>
      <div style="width:230px;height:230px;flex:none;">${mark}</div>
    </div>`,
  },
]

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

if (!(await Bun.file(CHROME).exists())) {
  console.error(`Chrome not found at ${CHROME}. Nothing was written.`)
  process.exit(1)
}

// Checked before anything renders, because a missing font does not fail — the
// browser quietly falls back to a generic face and hands back an asset in the
// wrong typeface, which looks close enough to upload and is not the brand.
for (const [label, url] of Object.entries(FONT_FILES)) {
  if (!(await Bun.file(url).exists())) {
    console.error(
      `${label} is missing. Run the install first — rendering now would silently substitute a system font.`,
    )
    process.exit(1)
  }
}

/** Small enough to be a failed render, whatever the exit code said. */
const MIN_PLAUSIBLE_BYTES = 2_000

let failed = 0

for (const asset of ASSETS) {
  const page = `<!doctype html><meta charset="utf-8" />
<style>*{margin:0;padding:0;box-sizing:border-box}${fonts}
body{width:${asset.width}px;height:${asset.height}px;overflow:hidden}
svg{width:100%;height:100%;display:block}</style>
${asset.body}`

  const html = Bun.fileURLToPath(new URL(`.render-${asset.name}.html`, OUT))
  const png = Bun.fileURLToPath(new URL(`${asset.name}.png`, OUT))

  await Bun.write(html, page)

  try {
    await Bun.$`${CHROME} --headless --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --screenshot=${png} --window-size=${asset.width},${asset.height} ${html}`.quiet()

    // A zero exit is not proof of a picture. Checking the size catches a render
    // that produced nothing, which would otherwise be reported as success and
    // uploaded as a blank image.
    const size = Bun.file(png).size
    if (size < MIN_PLAUSIBLE_BYTES) {
      throw new Error(`wrote only ${size} bytes`)
    }

    console.log(
      `${asset.name.padEnd(16)} ${asset.width}x${asset.height}  ${png}`,
    )
  } catch (cause) {
    // One asset failing should not abandon the rest, and should not be
    // something you discover by noticing a stale file later.
    failed += 1
    console.error(`${asset.name.padEnd(16)} FAILED  ${cause}`)
  } finally {
    // In `finally` on purpose: the shell throws on a non-zero exit, and the
    // previous version left this scaffolding sitting in brand/ looking like
    // something you could upload.
    await Bun.$`rm -f ${html}`.quiet().nothrow()
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${ASSETS.length} assets failed to render.`)
  process.exit(1)
}
