import { useCallback, useEffect, useState } from 'react'

import {
  listAllProjectsForAdmin,
  listFeaturedProjects,
  listProjects,
  listProjectsByCategory,
} from '@/services'
import type { Project, ProjectCategory } from '@/types'

type UseProjectsOptions = {
  category?: ProjectCategory
  /** Set true in admin pages to include hidden projects. */
  includeHidden?: boolean
  /** Set true to fetch only featured (homepage) projects. */
  featured?: boolean
}

export function useProjects(categoryOrOpts?: ProjectCategory | UseProjectsOptions) {
  const opts: UseProjectsOptions =
    typeof categoryOrOpts === 'string'
      ? { category: categoryOrOpts }
      : (categoryOrOpts ?? {})

  const { category, includeHidden = false, featured = false } = opts

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const buildFetcher = useCallback(() => {
    if (includeHidden) return listAllProjectsForAdmin()
    if (featured) return listFeaturedProjects()
    if (category) return listProjectsByCategory(category)
    return listProjects()
  }, [category, includeHidden, featured])

  const fetchProjects = useCallback(() => {
    setLoading(true)
    return buildFetcher()
      .then((data) => setProjects(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err : new Error(String(err))),
      )
      .finally(() => setLoading(false))
  }, [buildFetcher])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    buildFetcher()
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [buildFetcher])

  const refresh = useCallback(() => fetchProjects(), [fetchProjects])

  return { projects, loading, error, refresh, setProjects }
}
