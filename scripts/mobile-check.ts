/**
 * Checks the page on real iPhone profiles, in Safari's own engine.
 *
 *   bun run mobile:check              against the local build
 *   bun run mobile:check https://…    against anything deployed
 *
 * WebKit is what Safari runs, so this is the renderer that clipped the hero
 * card on iPhone — not an approximation of it in Chrome. That distinction is
 * the whole reason this exists: the bug was reported from Safari and Brave on
 * iOS, both WebKit, and it did not reproduce in Chrome at the same viewport
 * width. Eyeballing a narrow Chrome window would have declared it fixed.
 *
 * It asserts rather than illustrates. A screenshot needs someone to look at it
 * and notice; these checks fail the command. Two things are measured:
 *
 *   Whether the card's content overflows its own box. The face is
 *   `overflow-hidden` for the foil edge and the sheen, so overflow here does
 *   not scroll — it silently cuts the amount and the use count off the bottom,
 *   which is exactly what was reported.
 *
 *   Whether the document scrolls sideways. Horizontal overflow on a phone is
 *   always a bug and is easy to introduce without noticing on a desktop.
 *
 * Screenshots are still written, because when something does fail you want to
 * see it, not just read a number.
 */

import { webkit, devices } from 'playwright'

const url = Bun.argv[2] ?? 'http://localhost:8899/'
const outDir = new URL('../.mobile-check/', import.meta.url)

/**
 * Slack allowed beyond the card's own bottom padding before the space reads as
 * a hole rather than as breathing room. The padding is read from the rendered
 * card rather than copied here: a threshold that restates a value defined
 * somewhere else stops being true the moment that value changes.
 */
const SLACK_TOLERANCE = 8

/** Smallest phone still in use, the common size, and the largest. */
const PROFILES = ['iPhone SE', 'iPhone 12', 'iPhone 14 Pro Max'] as const

type Probe = {
  clientH: number
  scrollH: number
  overflow: number
  rowGap: number | null
  padBottom: number
  sidewaysScroll: number
  error?: string
}

const browser = await webkit.launch()
let failures = 0

console.log(`checking ${url}\n`)

for (const name of PROFILES) {
  const device = devices[name]

  // Declared out here and created inside, so the release below covers a
  // failure to create it too. The first version of this guard opened after
  // both creations, which left two of the four operations that can throw in
  // this loop still able to abort every remaining profile and skip every
  // close — the exact failure the guard was added to prevent.
  let context: Awaited<ReturnType<typeof browser.newContext>> | undefined

  try {
    context = await browser.newContext({ ...device })
    const page = await context.newPage()

    await page.goto(url, { waitUntil: 'networkidle' })
    // The card cycles through its phases; wait for one that shows every field.
    await page.waitForTimeout(2600)

    const probe: Probe = await page.evaluate(() => {
      const face = document.querySelector('figure [class*="overflow-hidden"]')
      if (!face) {
        return {
          clientH: 0,
          scrollH: 0,
          overflow: 0,
          rowGap: null,
          padBottom: 0,
          sidewaysScroll: 0,
          error: 'card face not found',
        }
      }

      const dl = face.querySelector('dl')
      if (!dl) {
        return {
          clientH: 0,
          scrollH: 0,
          overflow: 0,
          rowGap: null,
          padBottom: 0,
          sidewaysScroll: 0,
          error: 'bottom data row not found',
        }
      }

      const faceBox = face.getBoundingClientRect()
      const dlBox = dl.getBoundingClientRect()
      const doc = document.documentElement

      return {
        clientH: Math.round(face.clientHeight),
        scrollH: Math.round(face.scrollHeight),
        overflow: Math.round(face.scrollHeight - face.clientHeight),
        // Distance from the bottom data row to the card's bottom edge.
        // Negative means the row is hanging outside and being cut.
        rowGap: Math.round(faceBox.bottom - dlBox.bottom),
        padBottom: Math.round(
          parseFloat(getComputedStyle(face).paddingBottom) || 0,
        ),
        sidewaysScroll: doc.scrollWidth - doc.clientWidth,
      }
    })

    // Both directions, and a missing measurement is neither. Negative is the
    // row hanging outside and being cut; a large positive is dead space under
    // it, which is what happened when the clipping fix stopped the content
    // column stretching — this check measured that gap and passed it, because
    // it only asked whether the number was negative.
    //
    // A null gap used to coalesce to zero, which read as a perfect layout.
    // That is the one failure this tool cannot have: reporting success on a
    // card it could not measure. It is an error now, not a zero.
    const measured = probe.rowGap !== null
    const clipped = probe.overflow > 0 || (measured && probe.rowGap! < 0)
    const slack = measured && probe.rowGap! > probe.padBottom + SLACK_TOLERANCE
    const failed =
      Boolean(probe.error) ||
      !measured ||
      clipped ||
      slack ||
      probe.sidewaysScroll > 0
    if (failed) failures += 1

    const label = name.padEnd(18)
    const size = `${device.viewport.width}x${device.viewport.height}`.padEnd(9)

    console.log(
      probe.error
        ? `${label} ${size} ${probe.error}  FAILED`
        : `${label} ${size} card ${probe.clientH}px, content ${probe.scrollH}px, ` +
            `bottom gap ${probe.rowGap}px of ${probe.padBottom}px padding, ` +
            `sideways scroll ${probe.sidewaysScroll}px  ` +
            (failed ? 'FAILED' : 'ok'),
    )

    await page
      .locator('figure')
      .first()
      .screenshot({
        path: Bun.fileURLToPath(
          new URL(`${name.replace(/\s+/g, '-')}.png`, outDir),
        ),
      })
  } catch (cause) {
    failures += 1
    console.log(`${name.padEnd(18)} could not be checked — ${cause}`)
  } finally {
    await context?.close().catch(() => {})
  }
}

// In `finally` so a throw anywhere above still releases the browser rather
// than leaving it running after the process reports.
await browser.close().catch(() => {})

console.log(
  failures === 0
    ? `\nall ${PROFILES.length} profiles clear`
    : `\n${failures} of ${PROFILES.length} profiles failed — see .mobile-check/`,
)

process.exit(failures === 0 ? 0 : 1)
