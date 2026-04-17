import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAdminAuth } from '@/context/AdminAuthContext'
import { DEMO_CREDENTIALS, isSupabaseConfigured } from '@/services'

type LocationState = { from?: string } | null

export function AdminLogin() {
  const { signIn, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const from = state?.from ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    navigate(from, { replace: true })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-white/10 bg-white/[0.02] p-8"
      >
        <h1 className="font-display text-xl tracking-[-0.02em] text-white">Admin sign in</h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
          Restricted area
        </p>

        <label className="mt-8 block text-[11px] uppercase tracking-[0.22em] text-white/60">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/40"
          />
        </label>

        <label className="mt-5 block text-[11px] uppercase tracking-[0.22em] text-white/60">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/40"
          />
        </label>

        {error ? (
          <p className="mt-5 text-xs text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full border border-white/20 bg-white/5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        {!isSupabaseConfigured ? (
          <p className="mt-6 text-[10px] leading-relaxed text-white/35">
            Demo mode — use{' '}
            <span className="text-white/70">{DEMO_CREDENTIALS.email}</span>
            {' / '}
            <span className="text-white/70">{DEMO_CREDENTIALS.password}</span>
          </p>
        ) : null}
      </form>
    </div>
  )
}
