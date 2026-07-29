import { z } from 'zod'

/**
 * Syntax only, and worth being honest about the ceiling: this rejects what
 * cannot be an address, never what is not yours. `unclaimed.mailbox@gmail.com`
 * is perfectly valid and reaches nobody. Whether a mailbox exists is answered
 * by sending to it — see supabase/waitlist-delivery.sql.
 *
 * The HTML5 pattern on purpose. It is what the browser itself enforces on
 * `type="email"`, so the field and the schema agree instead of the form
 * accepting something the input had already underlined in red.
 */
export const waitlistSchema = z.object({
  email: z
    .email({
      pattern: z.regexes.html5Email,
      error: 'Enter a valid email address.',
    })
    .trim()
    .toLowerCase()
    .max(254, 'That email address is too long.'),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>
