import type { ArchiveImage } from '@/types'

import { projects } from './projects'

/**
 * Standalone archive entries — can later be `from('archive_images').select()`
 * or a join with projects.
 */
export const archiveImages: ArchiveImage[] = projects.flatMap((p) =>
  p.galleryImages.slice(0, 3).map((imageUrl, index) => ({
    id: `${p.id}-arch-${index}`,
    projectId: p.id,
    imageUrl,
    alt: `${p.title} — still ${index + 1}`,
  })),
)
