import { useMemo } from 'react'

import { getAllProjects, getProjectsByCategory } from '@/data'
import type { ProjectCategory } from '@/types'

/**
 * Thin hook over static data today; swap internals for Supabase + React Query later
 * without changing page components.
 */
export function useProjects(category?: ProjectCategory) {
  return useMemo(
    () => (category ? getProjectsByCategory(category) : getAllProjects()),
    [category],
  )
}
