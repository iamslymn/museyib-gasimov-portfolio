import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 py-24 text-center">
      <p className="font-display text-2xl text-white">404</p>
      <p className="mt-4 text-sm text-[var(--color-foreground-muted)]">
        This page does not exist.
      </p>
      <Link
        to="/"
        className="mt-10 text-[11px] uppercase tracking-[0.22em] text-white/90 hover:text-white"
      >
        Return home
      </Link>
    </div>
  )
}
