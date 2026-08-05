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

/** Foil at roughly a quarter strength over ink, flattened. Email cannot rely
 *  on rgba, and a hairline is the whole difference between a credential and a
 *  box. */
const FOIL_LINE = '#3e3a32'

const LINKEDIN = 'https://www.linkedin.com/company/woney-ai/'

export type ConfirmationEmail = {
  subject: string
  html: string
  text: string
}

/**
 * The address is printed back on the pass, so it reaches HTML and has to be
 * escaped. The insert policy already rejects `<`, `>`, `"` and whitespace in
 * an address, which makes this the second lock on the same door rather than
 * the first — and the one that keeps holding if that policy is ever loosened.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Stops the client restyling the address on the pass.
 *
 * Gmail scans text for anything shaped like an address and linkifies it, which
 * arrives as blue underlined text overriding the colour set on the cell. On a
 * credential that is the difference between an engraved field and a hyperlink
 * someone left in.
 *
 * The first attempt put the `@` in its own element to break the pattern. It
 * broke that one and created two: with the address split, the scanner found
 * `example.com` on each side and linkified both halves as domains instead.
 * Worse than before, and a good reminder that these detectors match several
 * shapes, not one.
 *
 * What works is giving the client nothing to do. Text already inside an anchor
 * is not scanned again, so the address is wrapped in one we author, with the
 * colour on an inner span where no client stylesheet reaches it. The anchor
 * carries no href: it is not a destination, it is a fence.
 */
function unlinkable(escapedAddress: string): string {
  return `<a style="color:${BONE};text-decoration:none;"><span style="color:${BONE};text-decoration:none;">${escapedAddress}</span></a>`
}

export function confirmationEmail(recipient: string): ConfirmationEmail {
  return {
    subject: 'You are on the Woney list',
    text: text(recipient),
    html: html(unlinkable(escapeHtml(recipient))),
  }
}

const text = (recipient: string) => `You are on the list.

Woney gives your agent a way to pay that is never your card. Each
purchase gets its own card, for one store and one amount. Once the
payment goes through, the card stops working.

  ACCESS PASS
  Holder   ${recipient}
  Status   On the list
  Access   Rolling batches

We are opening access in batches. When yours comes up, this is the
address we will write to.

Until then, you can watch it take shape. We post what we are building
on LinkedIn:

  ${LINKEDIN}

If you want to tell us what you would point an agent at first, just
reply. A person reads them.

woney.ai

You are receiving this because you joined the waitlist at woney.ai.`

const html = (
  recipient: string,
) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK_DEEP}" style="background-color:${INK_DEEP};margin:0;padding:0;width:100%;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">

        <!-- No masthead. A wordmark and a rule opened this letter, which meant
             the mark appeared twice in the first screenful — once as chrome
             and again on the pass a few lines below, where it is doing actual
             work. The rule's two labels are page furniture; in an inbox the
             sender name and the subject have already said who this is from.
             The letter starts on the sentence the reader came for. -->
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

            <!-- The pass. A confirmation is the one place an object belongs:
                 the reader has just handed over an address, and a credential
                 with their name on it is an exchange rather than an
                 announcement. It carries no number, no date and no queue
                 position — only what is true. -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;">
              <tr>
                <td bgcolor="${INK_DEEP}" style="background-color:${INK_DEEP};border:1px solid ${FOIL_LINE};padding:22px 24px;">

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1;color:${BONE};">
                        woney<span style="color:${FOIL};">.</span>
                      </td>
                      <td align="right" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${FOIL};">
                        Access pass
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;border-top:1px solid ${FOIL_LINE};">
                    <tr>
                      <td style="padding:16px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                        Holder
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:14px;line-height:1.4;word-break:break-all;color:${BONE};">
                        ${recipient}
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;">
                    <tr>
                      <td width="50%" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                        Status
                      </td>
                      <td width="50%" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                        Access
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:13px;color:${BONE_DIM};">
                        On the list
                      </td>
                      <td style="padding:5px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:13px;color:${BONE_DIM};">
                        Rolling batches
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <p style="margin:26px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BONE_DIM};">
              We are opening access in batches. When yours comes up, this is
              the address we will write to.
            </p>

            <!-- This used to end on "there is nothing else for you to do",
                 which is accurate and closes the door: it tells someone the
                 relationship is over until an unspecified day. The waiting is
                 the same either way, so give them somewhere to spend it. -->
            <p style="margin:20px 0 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BONE_DIM};">
              Until then, you can watch it take shape. We post what we are
              building on LinkedIn.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
              <tr>
                <td bgcolor="${FOIL}" style="background-color:${FOIL};">
                  <a href="${LINKEDIN}" style="display:inline-block;padding:15px 24px;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;line-height:14px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_DEEP};text-decoration:none;">
                    Follow Woney &rarr;
                  </a>
                </td>
              </tr>
            </table>

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
