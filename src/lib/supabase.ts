import type { SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

let client: SupabaseClient | null = null

/**
 * Loaded on first use, not at module load. Two reasons:
 * the SDK stays out of the initial bundle on a page whose only job is to
 * render fast, and a missing env var breaks the form submit instead of
 * blanking the whole landing page.
 *
 * The anon key is public. What protects the data is row level security:
 * this client can only INSERT into `waitlist`, never read it.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (client) return client

  const { createClient } = await import('@supabase/supabase-js')

  client ??= createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return client
}
