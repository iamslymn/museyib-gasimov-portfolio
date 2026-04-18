export type ProjectCategory = 'music-videos' | 'ai-works' | 'commercials' | 'experiments'

export type EmbedType = 'youtube' | 'vimeo'

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  'music-videos': 'Music Videos',
  'ai-works': 'AI Works',
  commercials: 'Commercials',
  experiments: 'Experiments',
}

export interface Project {
  id: string
  title: string
  slug: string
  /** One or more categories. Stored as `text[]` in Supabase. */
  categories: ProjectCategory[]
  thumbnail: string
  embedType: EmbedType
  embedUrl: string
  galleryImages: string[]
  isHidden: boolean
  /** Whether this project appears on the homepage. Not shown in public navbar. */
  isFeatured: boolean
  /** Sort position within the featured homepage list. null = unordered. */
  featuredOrder: number | null
  description?: string
  year?: string
  createdAt?: string
}

export interface ProjectImage {
  id: string
  projectId: string
  imageUrl: string
  sortOrder: number
  createdAt?: string
}

export interface ArchiveItem {
  id: string
  imageUrl: string
  title?: string | null
  createdAt?: string
}

export interface NewProjectInput {
  title: string
  slug: string
  categories: ProjectCategory[]
  embedType: EmbedType
  embedUrl: string
  thumbnailFile: File | null
  galleryFiles: File[]
  description?: string
  year?: string
  isHidden?: boolean
  isFeatured?: boolean
}

export interface EditProjectInput {
  id: string
  title: string
  slug: string
  categories: ProjectCategory[]
  embedType: EmbedType
  embedUrl: string
  thumbnailFile: File | null
  thumbnailExistingUrl: string
  galleryExistingUrls: string[]
  galleryNewFiles: File[]
  description?: string
  year?: string
  isHidden: boolean
  isFeatured: boolean
}

export interface NewArchiveItemInput {
  imageFile: File
  title?: string
}

export interface ContactInfo {
  email: string
  phone?: string
  instagram?: string
  instagramUrl?: string
  /** Optional portrait image URL displayed on the left column of the Contact page. */
  portraitUrl?: string
  location?: string
  availabilityNote?: string
}

export interface AdminUser {
  id: string
  email: string
}

export interface AdminAuthState {
  isAuthenticated: boolean
  user: AdminUser | null
  loading: boolean
}
