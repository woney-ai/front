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
const X_PROFILE = 'https://x.com/woney_ai'
const X_HANDLE = '@woney_ai'

/**
 * The share is the only thing in this letter that can grow the list, so it is
 * the letter's main action rather than a footnote.
 *
 * A confirmation is read at the one moment goodwill is highest: the reader has
 * just signed up, is pleased with themselves, and has us open in front of
 * them. Asking then costs nothing; asking later means asking someone who has
 * moved on. The version before this one only offered a follow, which moves a
 * number that never becomes a signup.
 *
 * A POST RATHER THAN A FORWARD, and the first attempt got this wrong. It
 * opened a prefilled `mailto:`, which on a phone throws the reader into their
 * mail app staring at a draft — an errand, and one almost nobody finishes.
 * Worse, it is private: the best case reaches one person.
 *
 * A post is public, so it reaches everyone who already chose to listen to
 * them, and "I am on the waitlist" is social proof in a way a forwarded note
 * can never be. It is also where this audience is: whoever ends up pointing an
 * agent at a checkout reads X, not a newsletter.
 *
 * The text is written in the sharer's voice, not ours, and leads with the
 * problem rather than our name — nobody posts an advertisement, and everybody
 * posts a thing they found. An earlier draft described the product in the
 * third person, which is an advertisement wearing someone else's account.
 *
 * IT CLAIMS ONE THING, AND ONLY BECAUSE THAT ONE IS BUILT. Single use is
 * enforced in three layers. A merchant lock is not: `intended_merchant` is a
 * memo string and nothing restricts where a card can be spent, which is why
 * "one store" is absent here even though it reads well. A page can be
 * corrected with a deploy. A post that spread cannot, and this one is about
 * money — the reader is being asked to put their own name behind it.
 */
/**
 * Two tags, and the number is the decision.
 *
 * They buy less than they used to: X recommends on what a post says rather
 * than on what it is tagged with, so these are not reach. What they still do
 * is land in search and in the saved searches people in a niche actually
 * watch, which is the only reason to carry any.
 *
 * Which is also why there are two and not four. Everything above this line is
 * written to sound like a person; a stack of tags turns the same words into an
 * advertisement, and an advertisement posted from someone else's account is
 * exactly what nobody agrees to send. Two at the end read as subject matter.
 *
 * `MCP` over anything broader because it is how an agent actually reaches us,
 * so it reaches the one reader who could integrate rather than the one who
 * merely approves of the idea. `payments` or `fintech` would be a wider net
 * over an audience that will never write the code.
 *
 * The handle replaced a bare `woney.ai` in the second line, and that is not a
 * cosmetic swap. Written as plain text, a post goes out and we never learn it
 * happened — no notification, nothing to reply to, nothing to amplify. A
 * mention arrives. The domain still appears at the end so the post carries a
 * destination for anyone reading it outside the app.
 *
 * The destination is a PATH and not a query parameter, because this link is
 * rendered in public under somebody else's name. Both `?utm_source=member-
 * share` and the shorter `?ref=share` were written and both read as tracking
 * machinery sitting in a stranger's post — X displays the path, so whatever
 * follows the domain is what everyone sees. A path reads like a page.
 *
 * ONE PATH FOR ALL OF X, deliberately. This link first pointed at `/share`,
 * which separated a post a member published from a post we published
 * ourselves. That distinction is the growth signal — a stranger recommending
 * us is not the same event as us advertising — and merging the two gives it
 * up: everything arriving through X now reports the same source, and no later
 * query can pull them apart, because the difference was never recorded.
 *
 * It was merged on purpose, for one owner, one path, no ambiguity about which
 * link to use. Worth knowing what it cost, and worth splitting again the day
 * anyone asks whether sharing works.
 *
 * A redirect maps `/x` to `/?ref=x`, and the signup accepts either name —
 * `params.get('utm_source') ?? params.get('ref')`. Today 23 of 25 signups have
 * no recorded source at all, so any answer beats the current none.
 */
const SHARE_POST = `Handing an AI agent your credit card is the part nobody wants to talk about.

${X_HANDLE} gives it a card of its own: one purchase, dead the second it pays.

Just joined the waitlist. woney.ai/x

#AIAgents #MCP`

const SHARE_URL = `https://x.com/intent/post?text=${encodeURIComponent(SHARE_POST)}`

/**
 * Both arguments are pinned, and each one is pinned against a different way of
 * being wrong.
 *
 * The locale, because the default follows whatever the runtime is set to —
 * which is how the same letter goes out reading `8/14/2026` to one reader and
 * `14/8/2026` to the next. Spelling the month removes the ambiguity entirely.
 *
 * The timezone, because a server's is an accident of where it is running, and
 * a date that moves with the deploy region is worse than one that is merely
 * not local. Worth saying plainly: UTC is not the reader's day. Someone who
 * joins late in the evening west of UTC gets a pass dated tomorrow, and
 * someone early in the morning east of it gets yesterday. That is at most a
 * day, on a field whose job is to say roughly when they were here, and the
 * alternative needs a timezone we never asked for and have no honest way to
 * guess. If we ever collect one, this is the line that should read it.
 */
const joinedOn = (at: Date) =>
  at.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

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

export function confirmationEmail(
  recipient: string,
  joinedAt?: Date,
): ConfirmationEmail {
  const joined = joinedOn(joinedAt ?? new Date())
  return {
    // The subject confirms AND says what the product is, because this line
    // outlives the moment. `You are on the Woney list` was a receipt: it wins
    // an open it was going to get anyway — confirmations are opened because
    // they are expected — and then sits in an inbox for months saying nothing
    // about what was joined. Someone searching their mail next quarter should
    // land on the promise, not the transaction.
    subject: 'You are on the list. Soon your agent can pay.',
    text: text(recipient, joined),
    html: html(unlinkable(escapeHtml(recipient)), joined),
  }
}

const text = (recipient: string, joined: string) => `You are on the list.

Your agent can already find the thing, compare sellers and fill the
cart. It stops at the part where paying means handing over your card.
Woney is what it uses instead: a card of its own, for that one
purchase, that stops working the moment the payment goes through.

  ACCESS PASS
  Holder   ${recipient}
  Joined   ${joined}
  Access   Rolling batches

This is the address we will write to when your batch comes up.

Post it on X:

  ${SHARE_URL}

One question, and the answer shapes what we build first: what would
you point an agent at? Just reply to this email. A person reads
every one.

We also post what we are building:

  ${X_PROFILE}
  ${LINKEDIN}

woney.ai

You are receiving this because you joined the waitlist at woney.ai.`

/**
 * The head, and it is not decoration — without it this letter goes out blank.
 *
 * Mail clients with a dark theme do not all leave a dark message alone. Some
 * apply PARTIAL inversion: they flip background colours and honour the inline
 * `color` on the text, which is the one combination that destroys a letter
 * built like this one. Measured on the version before this head existed, by
 * inverting backgrounds and leaving the authored text colours untouched, the
 * worst pair came out at 1.05:1 — the headline, the emphasised line, the
 * wordmark and the reader's own address all rendered white on white. Anything
 * under 4.5:1 is hard to read; 1.05 is not there at all.
 *
 * `color-scheme` is how a message says it is already dark and needs no help.
 * Clients that honour it stop rewriting anything. Outlook.com does not read
 * it — it stamps `data-ogsb` and `data-ogsc` on elements it has recoloured, so
 * those attributes are used to put the palette back.
 *
 * This does not make the problem impossible everywhere; some clients invert
 * regardless of what a message asks for. It removes the case that is ours to
 * remove, and the rest needs a real device to answer.
 */
const head = `<!doctype html>
<html lang="en" style="color-scheme:dark;supported-color-schemes:dark;">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<style>
  :root { color-scheme: dark; supported-color-schemes: dark; }

  /* Outlook.com stamps these attributes on what it has recoloured. Only the
     two backgrounds are restored here, deliberately: every text colour in this
     letter is already inline, so putting the dark panels back is enough to
     make them legible again. Re-asserting each text colour would need a class
     on all twenty of them to preserve the hierarchy, and a blanket rule would
     flatten it — one grey where there are now three. */
  [data-ogsb] .ink-deep, [data-ogsc] .ink-deep { background-color: ${INK_DEEP} !important; }
  [data-ogsb] .ink, [data-ogsc] .ink { background-color: ${INK} !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${INK_DEEP};">`

const html = (
  recipient: string,
  joined: string,
) => `${head}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK_DEEP}" class="ink-deep" style="background-color:${INK_DEEP};margin:0;padding:0;width:100%;">
  <tr>
    <td align="center" style="padding:32px 8px;">

      <!-- Fluid to 560, not fixed at it.
           This table used to assert its size twice, in the width attribute and
           again in an inline width, and the max-width beside them could not
           pull it back — the containing block is sized by this very table, so
           the constraint chased its own tail. Measured on a 390pt phone, the
           document came out 592pt wide; the client then zoomed the whole
           letter down to make it fit, and 16px body text arrived looking like
           11px. That is the entire reason this letter read smaller than the
           ones sitting next to it in an inbox.

           The ghost table below is not belt and braces, it is the other half
           of the fix. Outlook renders through Word, which reads the HTML width
           attribute and ignores CSS max-width — so the fluid table that saves
           the phone leaves Word with no numeric cap at all, and it would
           stretch this letter across the whole reading pane. The conditional
           comment gives Word a fixed 560 to hold and is invisible to every
           other client, which sees only the fluid table and its ceiling. -->
      <!--[if mso]>
      <table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
      <![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;margin:0 auto;">

        <!-- No masthead. A wordmark and a rule opened this letter, which meant
             the mark appeared twice in the first screenful — once as chrome
             and again on the pass a few lines below, where it is doing actual
             work. The rule's two labels are page furniture; in an inbox the
             sender name and the subject have already said who this is from.
             The letter starts on the sentence the reader came for. -->
        <tr>
          <td bgcolor="${INK}" class="ink" style="background-color:${INK};padding:40px 22px 36px;">

            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;letter-spacing:-0.015em;font-weight:400;color:${BONE};">
              You are on<br />
              <em style="color:${FOIL};font-style:italic;">the list.</em>
            </h1>

            <!-- This opens on what the agent can do, not on how a card is
                 issued. The old first line led with the mechanism — one card
                 per purchase, one store, one amount — which is the answer to a
                 question the reader has not asked yet. They arrived from a
                 page whose headline is "Agents can shop. They can't pay."; a
                 letter that drops the tension and starts explaining plumbing
                 is a step backwards from the thing that persuaded them. -->
            <p style="margin:26px 0 0;font-family:Helvetica,Roboto,Arial,sans-serif;font-size:17px;line-height:1.6;color:${BONE_DIM};">
              Your agent can already find the thing, compare sellers and fill
              the cart. It stops at the part where
              <span style="color:${BONE};">paying means handing over your
              card</span>. Woney is what it uses instead: a card of its own,
              for that one purchase, that stops working the moment the payment
              goes through.
            </p>

            <!-- The pass. A confirmation is the one place an object belongs:
                 the reader has just handed over an address, and a credential
                 with their name on it is an exchange rather than an
                 announcement. It carries no number, no date and no queue
                 position — only what is true. -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;">
              <tr>
                <td bgcolor="${INK_DEEP}" class="ink-deep" style="background-color:${INK_DEEP};border:1px solid ${FOIL_LINE};padding:22px 24px;">

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

                  <!-- The status field went, and a real date took its place.
                       It read "On the list", which the headline three lines up
                       already says, so it spent a row of a credential
                       repeating it. A join date is the one true thing this
                       pass can carry that gets more valuable with time: in a
                       year it is evidence of having been early, which is worth
                       having and worth showing. Still no queue position and no
                       promised date, because neither would be true. -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;">
                    <tr>
                      <td width="50%" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                        Joined
                      </td>
                      <td width="50%" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${BONE_FAINT};">
                        Access
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:13px;color:${BONE_DIM};">
                        ${joined}
                      </td>
                      <td style="padding:5px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:13px;color:${BONE_DIM};">
                        Rolling batches
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- One sentence, and it took two drafts to get there.
                 It opened on "we open access in batches", which the pass three
                 lines above already states as its own field — the reader had
                 just been told, in a credential with their name on it. Prose
                 that repeats the object beside it makes both weaker.
                 What survives is the half the pass cannot say: that this
                 address is the one we use, and that nothing else is coming.
                 A waitlist with no stated cadence is one people brace against,
                 and the bracing arrives later as an unsubscribe on the mail
                 that actually matters. -->
            <p style="margin:26px 0 0;font-family:Helvetica,Roboto,Arial,sans-serif;font-size:17px;line-height:1.6;color:${BONE_DIM};">
              This is the address we will write to when your batch comes up.
            </p>

            <!-- The share is the button and nothing else.
                 It has lost a paragraph and then a sentence, and each cut made
                 it better. First it argued the case — "the most useful thing
                 you can do for us today" — which on a confirmation reads as a
                 pitch arriving before the product does. Then it explained
                 itself, which is the same thing said quietly.
                 A button on a rule, with a label that says exactly what
                 happens: anyone inclined to help does not need persuading, and
                 anyone who is not can skip it without reading a word. -->
            <!-- The rule is a border on the cell that holds the button, not a
                 table of its own with a spacer inside it.
                 The spacer version needed a filler character to give the cell
                 something to lay out, and Gmail on Android rendered that
                 character: a stray dash floating above the button, in a letter
                 whose whole job is to look considered. Hanging the border on a
                 cell that already has content to hold removes the filler, the
                 extra table, and the artifact together. -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0;">
              <tr>
                <td style="border-top:1px solid ${LINE};padding:30px 0 0;">

            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${FOIL}" style="background-color:${FOIL};">
                  <a href="${SHARE_URL}" style="display:inline-block;padding:15px 24px;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;line-height:14px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_DEEP};text-decoration:none;">
                    Post it on X &rarr;
                  </a>
                </td>
              </tr>
            </table>

                </td>
              </tr>
            </table>

            <!-- The reply ask closes the letter, and the position is the whole
                 argument for it.
                 It began buried in the footer, moved to the middle, and ends
                 here: last is where a reader is most likely to act, because
                 nothing follows to distract them, and it is the note they
                 leave with. Everything above it is us telling them things.
                 This is the one line that hands the conversation back.
                 It also earns its keep three ways — at twenty-two signups the
                 answers are the clearest product research available, being
                 asked is what turns a stranger into a participant, and a reply
                 teaches the mail provider we are a correspondent rather than a
                 sender, which is worth more to deliverability than anything we
                 could put in a header. -->
            <p style="margin:30px 0 0;font-family:Helvetica,Roboto,Arial,sans-serif;font-size:17px;line-height:1.6;color:${BONE_DIM};">
              <span style="color:${BONE};">One question, and the answer shapes
              what we build first: what would you point an agent at?</span>
              Just reply to this email. A person reads every one.
            </p>

          </td>
        </tr>

        <!-- The footer, which is where a letter says who sent it and how to
             reach them. It was one line of legal text.

             The icons are hosted PNGs, because SVG is stripped and a data URI
             is dropped by most clients. Each carries alt text and sits inside
             a link, so a client with images off — which is the default in
             Outlook and common elsewhere — still shows a readable, clickable
             word rather than a broken frame. That is the whole reason the row
             is not icons alone. -->
        <tr>
          <td style="padding:26px 22px 0;">

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1;color:${BONE};">
                  woney<span style="color:${FOIL};">.</span>
                </td>
                <!-- The anchor is styled, not just the image, because the
                     styling IS the fallback. With images off the alt text is
                     what renders, and an unstyled anchor serves it as default
                     blue underlined browser text — which looks like something
                     broke rather than like a link somebody meant. Dressed
                     this way it degrades to the word "LinkedIn" set in the
                     letter's own type. -->
                <td align="right" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.1em;">
                  <a href="${X_PROFILE}" style="color:${BONE_DIM};text-decoration:none;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.1em;">
                    <img src="https://woney.ai/email/x.png" width="30" height="30" alt="X" style="display:inline-block;border:0;outline:none;width:30px;height:30px;color:${BONE_DIM};font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.1em;text-decoration:none;" />
                  </a>
                  <span style="display:inline-block;width:10px;">&nbsp;</span>
                  <a href="${LINKEDIN}" style="color:${BONE_DIM};text-decoration:none;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.1em;">
                    <img src="https://woney.ai/email/linkedin.png" width="30" height="30" alt="LinkedIn" style="display:inline-block;border:0;outline:none;width:30px;height:30px;color:${BONE_DIM};font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.1em;text-decoration:none;" />
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:22px 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;line-height:1.8;letter-spacing:0.06em;color:${BONE_FAINT};">
              You are receiving this because you joined the waitlist at
              <a href="https://woney.ai" style="color:${BONE_FAINT};text-decoration:underline;">woney.ai</a>.
            </p>
          </td>
        </tr>

      </table>
      <!--[if mso]>
      </td></tr></table>
      <![endif]-->

    </td>
  </tr>
</table>
</body>
</html>`
