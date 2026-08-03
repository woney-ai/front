import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { track } from '@vercel/analytics'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { joinWaitlist } from './api'
import { waitlistSchema, type WaitlistInput } from './schema'

type FormState = 'idle' | 'joined' | 'already-joined'

const successCopy: Record<Exclude<FormState, 'idle'>, string> = {
  joined: "You're on the list. We'll email you when access opens.",
  'already-joined': "You're already on the list. We'll be in touch.",
}

export function WaitlistForm({ className }: { className?: string }) {
  const [state, setState] = useState<FormState>('idle')

  const form = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: '' },
  })

  const {
    formState: { errors, isSubmitting },
  } = form

  async function onSubmit(values: WaitlistInput) {
    try {
      const result = await joinWaitlist(values)

      // Not a failure to hide behind "try again" — the address is fine and the
      // wait is finite, so say both.
      if (result.status === 'rate-limited') {
        form.setError('email', {
          message: 'Too many attempts from your network. Try again in an hour.',
        })
        return
      }

      setState(result.status)
      form.reset()

      // After the UI has committed, and in its own try. The row is already
      // saved: if measurement fails, or an ad blocker eats it, the visitor
      // must never be told their signup failed. Counting is our problem.
      //
      // No email here either — the address belongs in the database, not in an
      // analytics event.
      try {
        track('waitlist_signup', { status: result.status })
      } catch {
        // Deliberately swallowed. A lost datapoint is not worth a false error.
      }
    } catch {
      // The failure path counts too. Without this, a form that breaks for
      // everyone — bad env var, Supabase down, a changed RLS policy — produces
      // exactly the same analytics as a quiet day: no events. Silence would
      // mean both "nobody came" and "nobody can sign up".
      try {
        track('waitlist_signup_failed')
      } catch {
        // Same reasoning as the success path: measurement never worsens the
        // visitor's experience.
      }

      form.setError('email', {
        message: "We couldn't save your email. Please try again.",
      })
    }
  }

  if (state !== 'idle') {
    return (
      <div
        className={cn(
          'animate-seal flex items-center gap-3 border border-signal/30 bg-signal/8 px-4 py-4 text-sm text-bone',
          className,
        )}
        role="status"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-signal/20">
          <Check className="size-3 text-signal" aria-hidden />
        </span>
        {successCopy[state]}
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('w-full', className)}
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <Input
            id="waitlist-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'waitlist-email-error' : undefined}
            className="h-12 rounded-none border-line bg-white/[0.03] px-4 font-mono text-sm text-bone shadow-none placeholder:text-bone-faint focus-visible:border-foil/50 focus-visible:ring-0 md:text-sm"
            {...form.register('email')}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="group relative h-12 overflow-hidden rounded-none bg-bone px-6 font-mono text-[0.6875rem] tracking-[0.16em] text-ink uppercase transition-colors hover:bg-white"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              Request access
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </>
          )}
        </Button>
      </div>

      <p
        id="waitlist-email-error"
        className="mt-2.5 min-h-5 font-mono text-xs text-destructive"
        role={errors.email ? 'alert' : undefined}
      >
        {errors.email?.message}
      </p>

      <p className="text-xs text-bone-faint">
        Access opens in batches. No spam, unsubscribe anytime.
      </p>
    </form>
  )
}
