import { getSupabase } from '@/lib/supabase'

import type { WaitlistInput } from './schema'

const UNIQUE_VIOLATION = '23505'

/**
 * Raised by the rate limit trigger. PostgREST reads the `PT` prefix as an
 * instruction to answer with that HTTP status, so this arrives as a 429.
 */
const RATE_LIMITED = 'PT429'

export type JoinWaitlistResult =
  | { status: 'joined' }
  | { status: 'already-joined' }
  | { status: 'rate-limited' }

/**
 * Captures a signup. `source` and `referrer` are stored so we can tell
 * which channel is actually driving demand once traffic starts arriving.
 */
export async function joinWaitlist({
  email,
}: WaitlistInput): Promise<JoinWaitlistResult> {
  const params = new URLSearchParams(window.location.search)

  const supabase = await getSupabase()

  const { error } = await supabase.from('waitlist').insert({
    email,
    source: params.get('utm_source') ?? params.get('ref'),
    referrer: document.referrer || null,
  })

  if (!error) {
    return { status: 'joined' }
  }

  if (error.code === UNIQUE_VIOLATION) {
    return { status: 'already-joined' }
  }

  if (error.code === RATE_LIMITED) {
    return { status: 'rate-limited' }
  }

  throw new Error(error.message)
}
