import { z } from 'zod'

export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter your email address.')
    .max(254, 'That email address is too long.')
    .email('Enter a valid email address.'),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>
