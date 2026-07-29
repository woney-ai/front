/**
 * Asks the provider what actually happened to each confirmation.
 *
 * A 2xx from the send endpoint means Resend accepted the message. Delivery is
 * decided afterwards, by the receiving server, and nothing reports it back to
 * us. So `confirmation_sent_at` records an intention, and until something
 * reconciles it against reality the table cannot answer the only question the
 * list exists to answer: how many of these are real people.
 *
 * That matters most on the day the list is finally used. One large send to an
 * address book of unknown quality is exactly how a young domain teaches Gmail
 * to distrust it, in the send where it can least afford to.
 *
 * Polling rather than a webhook, deliberately. A webhook would need a public
 * endpoint, signature verification and another surface to defend, to buy
 * latency that nothing here consumes — nobody acts on a bounce in real time.
 * This reuses the shape already in the codebase: a claim function that hands
 * out work under a lease, a cron that drives it, a health check that reads the
 * result.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

/** Resend allows 2 requests/second on the free tier. Stay under it. */
const POLL_INTERVAL_MS = 550

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/**
 * Once a message reaches one of these, asking again can only return the same
 * answer, so the row stops being polled.
 */
const TERMINAL = new Set([
  'delivered',
  'bounced',
  'complained',
  'canceled',
  'failed',
])

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

type PendingRow = { id: string; provider_message_id: string }

async function lastEvent(apiKey: string, messageId: string): Promise<string> {
  const response = await fetch(`${RESEND_ENDPOINT}/${messageId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  // Resend prunes old messages. A 404 is an answer, not an error: the message
  // is gone and asking again forever would keep the row in the queue for good.
  if (response.status === 404) {
    return 'expired'
  }

  if (!response.ok) {
    throw new Error(
      `Resend responded ${response.status}: ${await response.text()}`,
    )
  }

  const body = (await response.json()) as { last_event?: string }

  return body.last_event ?? 'unknown'
}

Deno.serve(async () => {
  const supabase = createClient(
    required('SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )

  const apiKey = required('RESEND_API_KEY')

  const { data, error } = await supabase.rpc('claim_waitlist_deliveries', {
    batch_size: numeric('WAITLIST_RECONCILE_BATCH_SIZE', 40),
  })

  if (error) {
    console.error('claim failed', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const pending = (data ?? []) as PendingRow[]

  if (pending.length === 0) {
    return Response.json({ claimed: 0, resolved: 0, pending: 0, failed: 0 })
  }

  let resolved = 0
  let stillPending = 0
  let failed = 0

  for (const [index, row] of pending.entries()) {
    if (index > 0) await sleep(POLL_INTERVAL_MS)

    let status: string

    try {
      status = await lastEvent(apiKey, row.provider_message_id)
    } catch (cause) {
      // The claim already stamped delivery_checked_at, so this row simply
      // waits for the next sweep rather than blocking the ones behind it.
      failed += 1
      console.error(`poll failed for ${row.id}`, cause)
      continue
    }

    const { error: markError } = await supabase
      .from('waitlist')
      .update({ delivery_status: status })
      .eq('id', row.id)

    if (markError) {
      failed += 1
      console.error(`could not record status for ${row.id}`, markError)
      continue
    }

    if (TERMINAL.has(status)) {
      resolved += 1
    } else {
      stillPending += 1
    }
  }

  return Response.json({
    claimed: pending.length,
    resolved,
    pending: stillPending,
    failed,
  })
})
