/**
 * The waitlist confirmation email.
 *
 * Two constraints shape the markup, and both come from email clients rather
 * than from taste:
 *
 *   * Layout is tables with inline styles. Outlook renders HTML through Word,
 *     which has no flexbox, no grid, and no external stylesheet.
 *   * Type is a system stack. Webfonts do not load in most clients, so the
 *     site's Instrument Serif degrades to Georgia — close enough in colour
 *     and contrast that the letter still reads as the same object.
 *
 * THE PALETTE IS THE SITE'S, MEASURED. These values were sampled from the
 * built stylesheet by painting each token onto a canvas and reading the pixel,
 * because computed styles serialise as `oklch` and cannot be pasted into an
 * email. The previous set was warm neutral grey while the site is blue-tinted,
 * so the letter read as a different company's. `--line` is white at 9%, which
 * email cannot rely on, so it is flattened against the panel here.
 *
 * Dark backgrounds are declared with both `bgcolor` and inline
 * `background-color` so a client that drops one still honours the other, and
 * every text colour is set explicitly so a client forcing dark mode cannot
 * leave dark text on a dark panel.
 *
 * THE COPY IS THE PAGE'S, DELIBERATELY. The second paragraph is the wording of
 * How it works step three and the first of the six controls, near enough word
 * for word. Someone joins the list, reads the page, and gets this a minute
 * later: hearing the same sentences is the point, not a shortage of them.
 */

const INK_DEEP = '#03050a'
const INK = '#070a10'
const BONE = '#f3f0e8'
const BONE_DIM = '#a7abb3'
const BONE_FAINT = '#82868f'
const FOIL = '#e5ca98'
const LINE = '#1d2025'

export type ConfirmationEmail = {
  subject: string
  html: string
  text: string
}

export function confirmationEmail(): ConfirmationEmail {
  return {
    subject: 'You are on the Woney list',
    text: TEXT,
    html: HTML,
  }
}

const TEXT = `WONEY — AGENTIC PAYMENTS INFRASTRUCTURE

You are on the list.

Woney gives your agent a way to pay that is never your card. Each
purchase gets its own card, for one store and one amount. Once the
payment goes through, the card stops working.

We are opening access in batches. When yours comes up, this is the
address we will write to. There is nothing else for you to do.

If you want to tell us what you would point an agent at first, just
reply. A person reads them.

woney.ai

You are receiving this because you joined the waitlist at woney.ai.`

const HTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK_DEEP}" style="background-color:${INK_DEEP};margin:0;padding:0;width:100%;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">

        <!-- The wordmark, set the way the site header sets it: serif, with the
             foil full stop that is the only mark Woney has. It used to be the
             name in uppercase mono, which is the site's label voice, not its
             signature. -->
        <tr>
          <td style="padding:0 0 18px;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1;color:${BONE};">woney<span style="color:${FOIL};">.</span></span>
          </td>
        </tr>

        <!-- The rule across the top of the page, carried over intact. -->
        <tr>
          <td style="padding:0 0 14px;border-bottom:1px solid ${LINE};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                  Agentic payments infrastructure
                </td>
                <td align="right" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                  Private beta &middot; 2026
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td bgcolor="${INK}" style="background-color:${INK};padding:44px 40px 40px;">

            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;letter-spacing:-0.015em;font-weight:400;color:${BONE};">
              You are on<br />
              <em style="color:${FOIL};font-style:italic;">the list.</em>
            </h1>

            <p style="margin:26px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BONE_DIM};">
              Woney gives your agent a way to pay that is
              <span style="color:${BONE};">never your card</span>. Each purchase
              gets its own card, for one store and one amount. Once the payment
              goes through, the card stops working.
            </p>

            <p style="margin:20px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BONE_DIM};">
              We are opening access in batches. When yours comes up, this is
              the address we will write to. There is nothing else for you to
              do.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;border-top:1px solid ${LINE};">
              <tr>
                <td style="padding:24px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${BONE_DIM};">
                  If you want to tell us what you would point an agent at
                  first, just reply.
                  <span style="color:${BONE};">A person reads them.</span>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr>
          <td style="padding:22px 40px 0;">
            <p style="margin:0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;line-height:1.8;letter-spacing:0.06em;color:${BONE_FAINT};">
              You are receiving this because you joined the waitlist at
              <a href="https://woney.ai" style="color:${BONE_FAINT};text-decoration:underline;">woney.ai</a>.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>`
