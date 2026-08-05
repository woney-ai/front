/**
 * Renders the waitlist confirmation to a file so it can be looked at without
 * deploying anything.
 *
 * The email lives in a Supabase edge function, which means the only way to see
 * a change used to be to deploy it and then join the list — a round trip that
 * costs a deploy, a real send, and a row in the waitlist table for every
 * adjustment to a paragraph. That is a bad enough loop that copy stops getting
 * adjusted.
 *
 *   bun run email:preview            writes and opens both variants
 *   bun run email:preview a@b.com    with a specific address on the pass
 *
 * It imports the same module the function bundles, so what appears here is
 * what would be sent. Nothing is mailed and nothing is deployed.
 *
 * Note: this renders in a browser, which is far more forgiving than a mail
 * client. It answers "is the copy right, is the layout sane" — not "does
 * Outlook agree". For that, send yourself a real one.
 */

import { confirmationEmail } from '../supabase/functions/send-waitlist-confirmation/email.ts'

const OUT_DIR = new URL('../.email-preview/', import.meta.url)

const recipient = Bun.argv[2] ?? 'you@company.com'

/** The wrapper prints the address too, and the address comes from argv. The
 *  email itself escapes it; this page had not, which made the preview the one
 *  place a bracket in an address could break out of its element. */
const escape = (v: string) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
const { subject, html, text } = confirmationEmail(recipient)

// A mail client gives the message a light chrome and a fixed viewport. Wrapping
// the HTML in neither would flatter it — the letter is dark and would appear to
// float on a dark page, which is not how anyone will meet it.
const page = `<!doctype html>
<meta charset="utf-8" />
<title>${escape(subject)}</title>
<style>
  body { margin: 0; background: #e9e9ec; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
  .chrome { max-width: 700px; margin: 0 auto; padding: 28px 0 56px; }
  .meta { background: #fff; border: 1px solid #d7d7dc; border-bottom: 0; padding: 16px 20px; color: #333; }
  .meta b { color: #000; }
  .meta div + div { margin-top: 4px; }
  .frame { border: 1px solid #d7d7dc; }
  .note { max-width: 700px; margin: 0 auto; padding: 0 0 20px; color: #6a6a72; font-size: 12px; }
</style>
<div class="note">Local preview — nothing was sent. A browser is more forgiving than a mail client.</div>
<div class="chrome">
  <div class="meta">
    <div><b>Subject</b> &nbsp; ${subject}</div>
    <div><b>To</b> &nbsp; ${escape(recipient)}</div>
  </div>
  <div class="frame">${html}</div>
</div>`

await Bun.write(new URL('index.html', OUT_DIR), page)
await Bun.write(
  new URL('plain.txt', OUT_DIR),
  `Subject: ${subject}\nTo: ${recipient}\n\n${text}`,
)

// `pathname` percent-encodes, so a directory containing a space would be
// handed to the shell as %20 and `open` would quietly find nothing.
const path = Bun.fileURLToPath(new URL('index.html', OUT_DIR))

console.log(`subject   ${subject}`)
console.log(`recipient ${recipient}`)
console.log(`html      ${path}`)
console.log(`text      ${Bun.fileURLToPath(new URL('plain.txt', OUT_DIR))}`)

if (!Bun.env.CI) {
  await Bun.$`open ${path}`.nothrow()
}
