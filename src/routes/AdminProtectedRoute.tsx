import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAdminAuth } from '@/context/AdminAuthContext'

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
