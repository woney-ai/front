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
): Promise<string | null> {
  const { subject, html, text } = confirmationEmail()

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
    console.error(`could not read the message id for ${to}`, cause)
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

  let sent = 0
  let failed = 0
  let unmarked = 0

  for (const [index, row] of pending.entries()) {
    if (index > 0) await sleep(SEND_INTERVAL_MS)

    let messageId: string | null

    try {
      messageId = await send(apiKey, from, replyTo, row.email)
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

  return Response.json({ claimed: pending.length, sent, failed, unmarked })
})
