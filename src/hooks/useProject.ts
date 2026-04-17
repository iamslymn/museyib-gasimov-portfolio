import { useEffect, useState } from 'react'

import { getProjectBySlug } from '@/services'
import type { Project } from '@/types'

export function useProject(slug: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!slug) {
      setProject(null)
      setLoading(false)
      return
    }

    setLoading(true)
    getProjectBySlug(slug)
      .then((p) => {
        if (!cancelled) setProject(p)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return { project, loading }
}
