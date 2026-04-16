export type ProjectCategory = 'music-videos' | 'ai-works' | 'commercials'

export type EmbedType = 'youtube' | 'vimeo'

/** Mirrors a future Supabase `projects` row shape. */
export interface Project {
  id: string
  title: string
  slug: string
  category: ProjectCategory
  thumbnail: string
  embedType: EmbedType
  embedUrl: string
  galleryImages: string[]
  description?: string
  year?: string
}

/** Mirrors a future Supabase `archive_images` (or join) shape. */
export interface ArchiveImage {
  id: string
  projectId: string
  imageUrl: string
  alt: string
}

/** Placeholder for future contact block / CMS row. */
export interface ContactInfo {
  email: string
  location?: string
  availabilityNote?: string
}
