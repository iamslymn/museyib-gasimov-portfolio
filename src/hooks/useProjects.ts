import { useCallback, useEffect, useState } from 'react'

import { listAllProjectsForAdmin, listProjects, listProjectsByCategory } from '@/services'
import type { Project, ProjectCategory } from '@/types'

type UseProjectsOptions = {
  category?: ProjectCategory
  /** Set true in admin pages to include hidden projects. */
  includeHidden?: boolean
}

export function useProjects(categoryOrOpts?: ProjectCategory | UseProjectsOptions) {
  const opts: UseProjectsOptions =
    typeof categoryOrOpts === 'string'
      ? { category: categoryOrOpts }
      : (categoryOrOpts ?? {})

  const { category, includeHidden = false } = opts

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProjects = useCallback(() => {
    setLoading(true)
    const fetcher = includeHidden
      ? listAllProjectsForAdmin()
      : category
        ? listProjectsByCategory(category)
        : listProjects()

    return fetcher
      .then((data) => setProjects(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err : new Error(String(err))),
      )
      .finally(() => setLoading(false))
  }, [category, includeHidden])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const fetcher = includeHidden
      ? listAllProjectsForAdmin()
      : category
        ? listProjectsByCategory(category)
        : listProjects()

    fetcher
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
  }, [category, includeHidden])

  const refresh = useCallback(() => fetchProjects(), [fetchProjects])

  return { projects, loading, error, refresh, setProjects }
}
