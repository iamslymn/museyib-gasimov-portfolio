import type { ArchiveItem } from '@/types'

import { projects } from './projects'

/**
 * Seed archive rows — derived from project gallery stills so the page is populated
 * before Supabase is wired up. Replace with `supabase.from('archive_items').select()`.
 */
export const archiveSeed: ArchiveItem[] = projects.flatMap((p) =>
  p.galleryImages.slice(0, 3).map((imageUrl, index) => ({
    id: `${p.id}-arch-${index}`,
    imageUrl,
    title: `${p.title} — still ${index + 1}`,
  })),
)
