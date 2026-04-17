import type { AdminUser } from '@/types'

import { supabase } from './supabase'

const STORAGE_KEY = 'mg.admin.session'
const DEMO_EMAIL = 'admin@museyibgasimov.com'
const DEMO_PASSWORD = 'admin1234'

function readSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

function writeSession(user: AdminUser | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!supabase) return readSession()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? '' }
}

export async function signIn(email: string, password: string): Promise<AdminUser> {
  if (!supabase) {
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      throw new Error('Invalid email or password.')
    }
    const user: AdminUser = { id: 'demo-admin', email: DEMO_EMAIL }
    writeSession(user)
    return user
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw error ?? new Error('Sign-in failed.')
  return { id: data.user.id, email: data.user.email ?? '' }
}

export async function signOut(): Promise<void> {
  if (!supabase) {
    writeSession(null)
    return
  }
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const DEMO_CREDENTIALS = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
}
