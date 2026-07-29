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
 * The palette matches the landing page. Dark backgrounds are declared with
 * both `bgcolor` and inline `background-color` so clients that drop one still
 * honour the other, and every text colour is set explicitly so a client
 * forcing dark mode cannot leave dark text on a dark panel.
 */

const INK = '#0b0b0c'
const PANEL = '#111113'
const BONE = '#eceae5'
const BONE_DIM = '#a4a09a'
const BONE_FAINT = '#6f6b66'
const FOIL = '#d8b878'
const LINE = '#26262a'

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

const TEXT = `YOU ARE ON THE LIST

Woney issues a single-use virtual card for every purchase, so an AI
agent can check out at any ecommerce merchant on your behalf — locked
to one store, one amount, one transaction. The card dies with the
payment, so there is nothing left for anyone to reuse.

We are opening access in rolling batches. When yours comes up, this is
the address we will write to. There is nothing else for you to do.

If you want to tell us what you would point an agent at first, reply to
this message. A person reads them.

— Woney
  woney.ai

You are receiving this because you joined the waitlist at woney.ai.`

const HTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="background-color:${INK};margin:0;padding:0;width:100%;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">

        <!-- Document header rule, same device as the top of the landing page -->
        <tr>
          <td style="padding:0 0 14px;border-bottom:1px solid ${LINE};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BONE_FAINT};">
                  Woney
                </td>
                <td align="right" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BONE_FAINT};">
                  Private beta &middot; 2026
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td bgcolor="${PANEL}" style="background-color:${PANEL};padding:44px 40px 40px;">

            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;letter-spacing:-0.01em;font-weight:400;color:${BONE};">
              You are on<br />
              <em style="color:${FOIL};font-style:italic;">the list.</em>
            </h1>

            <p style="margin:26px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BONE_DIM};">
              Woney issues a
              <span style="color:${BONE};">single-use virtual card</span>
              for every purchase, so an AI agent can check out at any ecommerce
              merchant on your behalf &mdash; locked to one store, one amount,
              one transaction. The card dies with the payment, so there is
              nothing left for anyone to reuse.
            </p>

            <p style="margin:20px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BONE_DIM};">
              We are opening access in rolling batches. When yours comes up,
              this is the address we will write to. There is nothing else for
              you to do.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;border-top:1px solid ${LINE};">
              <tr>
                <td style="padding:24px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${BONE_DIM};">
                  If you want to tell us what you would point an agent at
                  first, just reply to this message.
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
