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

async function send(
  apiKey: string,
  from: string,
  replyTo: string,
  to: string,
): Promise<void> {
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

  const sent: string[] = []
  const failed: string[] = []

  for (const [index, row] of pending.entries()) {
    if (index > 0) await sleep(SEND_INTERVAL_MS)

    try {
      await send(apiKey, from, replyTo, row.email)
      sent.push(row.id)
    } catch (cause) {
      // The row keeps confirmation_sent_at null, so the next run retries it
      // once the lease expires — up to max_attempts, then it is abandoned.
      failed.push(row.id)
      console.error(`send failed for ${row.id}`, cause)
    }
  }

  if (sent.length > 0) {
    const { error: markError } = await supabase
      .from('waitlist')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .in('id', sent)

    // Delivered but unmarked. The lease keeps the row quiet for retry_after,
    // then it sends again — a duplicate is the acceptable failure here, and
    // max_attempts bounds how many.
    if (markError) {
      console.error('mark failed after delivery', markError, sent)
      return Response.json({ error: markError.message }, { status: 500 })
    }
  }

  return Response.json({
    claimed: pending.length,
    sent: sent.length,
    failed: failed.length,
  })
})
