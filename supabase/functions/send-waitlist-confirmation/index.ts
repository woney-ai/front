/**
 * Drains the waitlist confirmation queue.
 *
 * Invoked from the database, never by the browser — by an insert trigger for
 * immediate delivery and by a cron sweep for anything that failed (see
 * supabase/waitlist-dispatch.sql). Nothing on the landing page can reach it:
 * the function requires a valid Authorization header, and the publishable key
 * that ships in the bundle is not one.
 *
 * Why a queue at all, when the trigger already sends immediately:
 *
 *   Every free sending tier has a daily cap and a rate limit, so a send can
 *   fail while the insert itself succeeds — the person never hears from us and
 *   nobody finds out for weeks. Leaving the row unmarked lets the sweep retry
 *   it, which turns that silent loss into a delay. Nobody minds a waitlist
 *   confirmation arriving three hours late; they mind one that never comes.
 *
 * Sends are sequential and spaced. Resend's free tier allows two requests per
 * second, so firing a batch concurrently would earn 429s. At the volumes this
 * page expects, one address at a time is also what makes a single bad address
 * fail alone instead of poisoning the whole batch.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

import { confirmationEmail } from './email.ts'

/** Resend allows 2 requests/second on the free tier. Stay under it. */
const SEND_INTERVAL_MS = 550

/** Every outbound call is bounded. Unbounded ones do not fail, they hang, and
 * a hang inside the loop spends the whole batch's wall clock on one row. */
const DNS_TIMEOUT_MS = 3_000
const SEND_TIMEOUT_MS = 15_000

/** Short on purpose. This one only decorates the letter, so it should give up
 *  long before it costs the batch anything. */
const JOIN_DATE_TIMEOUT_MS = 3_000

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function required(name: string): string {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing environment variable "${name}".`)
  }

  return value
}

function numeric(name: string, fallback: number): number {
  const raw = Deno.env.get(name)
  if (!raw) return fallback

  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type PendingRow = { id: string; email: string }

/**
 * Whether the domain can receive mail at all.
 *
 * This is the one bounce worth preventing rather than reporting: a domain with
 * no mail exchanger is not a maybe, and sending to it spends a message and
 * earns a hard bounce for an answer DNS would have given for free.
 *
 * It says nothing about the mailbox. `unclaimed.mailbox@gmail.com` passes this
 * and still hard bounces — gmail.com is real, that address is not. Only
 * delivery answers that, which is what the reconciler is for.
 *
 * Three-valued deliberately, because "cannot tell" is not "invalid". Only an
 * authoritative not-found rejects an address; a resolver timeout, a missing
 * permission or an unimplemented API all fall through to `unknown` and the
 * message is sent. Refusing a real person because DNS hiccuped is a far worse
 * failure than one avoidable bounce.
 */
/** The part after the LAST `@`. Splitting on the first one reads the wrong
 * host for `victim@a.com@attacker.net`: it would check `a.com` while the
 * message went somewhere else entirely. The insert policy now rejects a second
 * `@` outright, so this is the second of two locks on the same door. */
function domainOf(email: string): string {
  const at = email.lastIndexOf('@')
  return at === -1 ? '' : email.slice(at + 1)
}

async function domainAcceptsMail(
  domain: string,
): Promise<'yes' | 'no' | 'unknown'> {
  if (!domain) return 'no'

  // Bounded, because this now runs per row inside the send loop and a resolver
  // that hangs would burn the function's wall clock on a full batch — killing
  // it mid-batch, which is the failure the per-row marking exists to contain.
  const bounded = () => ({ signal: AbortSignal.timeout(DNS_TIMEOUT_MS) })

  try {
    const mx = await Deno.resolveDns(domain, 'MX', bounded())
    if (mx.length > 0) return 'yes'
  } catch (cause) {
    if (!(cause instanceof Deno.errors.NotFound)) {
      console.error(`MX lookup inconclusive for ${domain}`, cause)
      return 'unknown'
    }
  }

  // No MX is not the end of it. A host with only an A record still accepts
  // mail under the implicit-MX rule, which is rare but entirely legal.
  try {
    const a = await Deno.resolveDns(domain, 'A', bounded())
    return a.length > 0 ? 'yes' : 'no'
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return 'no'

    console.error(`A lookup inconclusive for ${domain}`, cause)
    return 'unknown'
  }
}

/**
 * Sends one confirmation and returns the provider's message id.
 *
 * That id is the whole reason this returns anything. A 2xx here means Resend
 * accepted the message, not that anyone received it — delivery resolves later,
 * out of band. Keeping the id is what lets the reconciler ask afterwards, and
 * without it a bounce is something you can only discover by opening a
 * dashboard, which is to say never.
 */
async function send(
  apiKey: string,
  from: string,
  replyTo: string,
  to: string,
  rowId: string,
  joinedAt: Date | undefined,
): Promise<string | null> {
  const { subject, html, text } = confirmationEmail(to, joinedAt)

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      html,
      text,
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(
      `Resend responded ${response.status}: ${await response.text()}`,
    )
  }

  // The message is already gone. A response we cannot parse costs us the
  // ability to follow it up, which is worth a null and a log — never a throw
  // that would mark the row unsent and mail this address a second time.
  try {
    const body = (await response.json()) as { id?: string }
    return body.id ?? null
  } catch (cause) {
    // The row id, not the address. These logs are centralized and an email is
    // personal data that has no business being in them.
    console.error(`could not read the message id for ${rowId}`, cause)
    return null
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    required('SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )

  const apiKey = required('RESEND_API_KEY')
  const from = required('WAITLIST_FROM')
  const replyTo = Deno.env.get('WAITLIST_REPLY_TO') ?? 'hello@woney.ai'

  const { data, error } = await supabase.rpc('claim_waitlist_confirmations', {
    batch_size: numeric('WAITLIST_BATCH_SIZE', 20),
    daily_cap: numeric('WAITLIST_DAILY_CAP', 95),
  })

  if (error) {
    console.error('claim failed', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const pending = (data ?? []) as PendingRow[]

  if (pending.length === 0) {
    return Response.json({ claimed: 0, sent: 0, failed: 0 })
  }

  // The pass prints the day they joined, and the claim function returns only
  // an id and an address. One read fills that in for the whole batch.
  //
  // A read rather than a wider return type on purpose: `claim_waitlist_
  // confirmations` is the piece that holds the lease and the daily budget, and
  // changing its signature means dropping and recreating it in production. A
  // date on a credential is not worth taking the mailer offline for.
  //
  // If the read fails the letter still goes out, dated today. Every row here
  // was just claimed and the trigger path sends within seconds of the insert,
  // so today is right for almost all of them and wrong by a day for a row that
  // sat in a backlog overnight. Losing a send over that would be the worse
  // trade.
  //
  // Which is why it is bounded and caught, like every other outbound call in
  // this file. Written without either, the claim above was false: a client
  // returns `{ error }` for an HTTP failure but a network-level fetch can
  // reject outright, and an unbounded call does not fail at all — it hangs,
  // holding the whole invocation before a single send has been attempted. The
  // batch is already claimed at this point, so that is not one missing date,
  // it is a run that mails nobody and leaves every row waiting for its lease
  // to expire. A decoration on a credential must not be able to do that.
  const joinedById = new Map<string, Date>()

  try {
    const { data: joinRows, error: joinError } = await supabase
      .from('waitlist')
      .select('id, created_at')
      .in(
        'id',
        pending.map((row) => row.id),
      )
      .abortSignal(AbortSignal.timeout(JOIN_DATE_TIMEOUT_MS))

    if (joinError) {
      console.error(
        'could not read join dates; dating this batch today',
        joinError,
      )
    } else {
      for (const row of (joinRows ?? []) as {
        id: string
        created_at: string
      }[]) {
        joinedById.set(row.id, new Date(row.created_at))
      }
    }
  } catch (cause) {
    console.error('join date read failed; dating this batch today', cause)
  }

  let sent = 0
  let failed = 0
  let unmarked = 0
  let undeliverable = 0

  for (const [index, row] of pending.entries()) {
    if (index > 0) await sleep(SEND_INTERVAL_MS)

    // Cheaper than a send and cheaper than a bounce. `invalid-domain` is a
    // terminal delivery status, so the row leaves the queue without ever
    // claiming we mailed it — confirmation_sent_at stays null, which is true.
    if ((await domainAcceptsMail(domainOf(row.email))) === 'no') {
      const { error: rejectError } = await supabase
        .from('waitlist')
        .update({ delivery_status: 'invalid-domain' })
        .eq('id', row.id)

      if (rejectError) {
        console.error(`could not mark ${row.id} undeliverable`, rejectError)
      }

      undeliverable += 1
      continue
    }

    let messageId: string | null

    try {
      messageId = await send(
        apiKey,
        from,
        replyTo,
        row.email,
        row.id,
        joinedById.get(row.id),
      )
    } catch (cause) {
      // The row keeps confirmation_sent_at null, so the next run retries it
      // once the lease expires — up to max_attempts, then it is abandoned.
      failed += 1
      console.error(`send failed for ${row.id}`, cause)
      continue
    }

    // Marked one at a time, immediately after its own send. Marking the whole
    // batch at the end was cheaper by one round trip and wrong in the way that
    // matters: this function can be killed mid-batch, and everything already
    // delivered would then be resent once the lease expired. Per row, a crash
    // costs one duplicate instead of twenty. It is also the only shape that
    // can store a different message id per row.
    const { error: markError } = await supabase
      .from('waitlist')
      .update({
        confirmation_sent_at: new Date().toISOString(),
        provider_message_id: messageId,
      })
      .eq('id', row.id)

    if (markError) {
      // Delivered but unmarked. The lease keeps the row quiet for retry_after,
      // then it sends again — one duplicate, bounded by max_attempts.
      unmarked += 1
      console.error(`mark failed after delivery for ${row.id}`, markError)
      continue
    }

    sent += 1
  }

  return Response.json({
    claimed: pending.length,
    sent,
    failed,
    unmarked,
    undeliverable,
  })
})
