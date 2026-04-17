import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client placeholder.
 *
 * Set these in `.env.local` when wiring the real backend:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 *
 * Until both are defined the client stays `null` and every service falls back
 * to the in-memory mock store. This lets the UI and admin flows be built end-to-end
 * today and flipped to real data simply by filling in the env vars.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = Boolean(supabase)

/** Storage bucket names we plan to create in Supabase. */
export const STORAGE_BUCKETS = {
  projectThumbnails: 'project-thumbnails',
  projectGallery: 'project-gallery',
  archive: 'archive',
} as const
