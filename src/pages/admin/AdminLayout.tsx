import { Link, Outlet, useNavigate } from 'react-router-dom'

import { useAdminAuth } from '@/context/AdminAuthContext'
import { isSupabaseConfigured } from '@/services'

export function AdminLayout() {
  const { user, signOut } = useAdminAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 py-5 sm:px-8">
          <Link
            to="/admin"
            className="font-display text-[13px] font-medium uppercase tracking-[0.28em]"
          >
            Admin
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70"
            >
              View site
            </Link>
            <span className="text-[11px] text-white/20">·</span>
            <span className="hidden text-[11px] text-white/40 sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {!isSupabaseConfigured ? (
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-white/40 sm:px-8">
          Supabase not configured — changes are stored in-memory only.
        </div>
      ) : null}

      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <Outlet />
      </main>
    </div>
  )
}
