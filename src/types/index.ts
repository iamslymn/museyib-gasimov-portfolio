export type ProjectCategory = 'music-videos' | 'ai-works' | 'commercials' | 'experiments'

export type EmbedType = 'youtube' | 'vimeo'

/** Ordered gallery on project detail: stills and/or extra embeds (hero embed is separate). */
export type GalleryMediaItem =
  | { type: 'image'; url: string }
  | { type: 'video'; embedType: EmbedType; embedUrl: string }

export function galleryImageUrls(media: GalleryMediaItem[]): string[] {
  return media.filter((m): m is { type: 'image'; url: string } => m.type === 'image').map((m) => m.url)
}

/**
 * Admin gallery editor row — images may be existing URLs, new file uploads, or a video embed.
 */
export type ProjectGalleryEditorItem =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; preview: string }
  | { kind: 'video'; id: string; embedType: EmbedType; embedUrl: string }

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
  /** Hero embed + gallery stills/embeds (ordered). */
  galleryMedia: GalleryMediaItem[]
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
  galleryItems: ProjectGalleryEditorItem[]
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
  galleryItems: ProjectGalleryEditorItem[]
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
