import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { getCurrentAdmin, signIn as signInService, signOut as signOutService } from '@/services'
import type { AdminAuthState, AdminUser } from '@/types'

type AdminAuthContextValue = AdminAuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getCurrentAdmin()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const u = await signInService(email, password)
    setUser(u)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOutService()
    setUser(null)
  }, [])

  const value: AdminAuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth must be used within <AdminAuthProvider>')
  }
  return ctx
}
