import { useCallback, useEffect, useState } from 'react'

import { listArchiveItems } from '@/services'
import type { ArchiveItem } from '@/types'

export function useArchive() {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    return listArchiveItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    listArchiveItems()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, setItems, loading, refresh }
}
