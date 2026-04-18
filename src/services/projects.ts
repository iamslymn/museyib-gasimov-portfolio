import { projectsSeed } from '@/data'
import type { EditProjectInput, NewProjectInput, Project, ProjectCategory } from '@/types'

import { uploadImage, uploadImages } from './storage'
import { STORAGE_BUCKETS, supabase } from './supabase'

const mockStore: Project[] = projectsSeed.map((p) => ({ ...p }))

// ── Ordering helpers ──────────────────────────────────────────────────────────

/** Apply a saved ID order to a list, leaving unmatched items at the end. */
function applyOrder(projects: Project[], order: string[] | null): Project[] {
  if (!order || order.length === 0) return projects
  const map = new Map(projects.map((p) => [p.id, p]))
  const ordered = order.map((id) => map.get(id)).filter((p): p is Project => !!p)
  const rest = projects.filter((p) => !order.includes(p.id))
  return [...ordered, ...rest]
}

/** Apply the global localStorage order on top of a fetched list. */
function applyClientOrder(projects: Project[]): Project[] {
  return applyOrder(projects, loadProjectOrder())
}

// ── Supabase query helpers ────────────────────────────────────────────────────

type DbProject = {
  id: string
  title: string
  slug: string
  categories: string[]
  embed_type: string
  embed_url: string
  thumbnail_url: string
  is_hidden: boolean
  is_featured: boolean
  featured_order: number | null
  description: string | null
  year: string | null
  sort_order: number
  created_at: string
  project_images: { image_url: string; sort_order: number }[]
}

function mapRow(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    categories: (row.categories ?? []) as ProjectCategory[],
    embedType: row.embed_type as 'youtube' | 'vimeo',
    embedUrl: row.embed_url,
    thumbnail: row.thumbnail_url,
    isHidden: row.is_hidden ?? false,
    isFeatured: row.is_featured ?? false,
    featuredOrder: row.featured_order ?? null,
    galleryImages: [...(row.project_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.image_url),
    description: row.description ?? undefined,
    year: row.year ?? undefined,
    createdAt: row.created_at,
  }
}

/**
 * Run a Supabase projects query ordered by sort_order first.
 * Falls back to created_at desc if sort_order column does not exist yet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryProjects(apply: (q: any) => any): Promise<Project[]> {
  const base = () =>
    apply(supabase!.from('projects').select('*, project_images(image_url, sort_order)'))

  const { data, error } = await base().order('sort_order', { ascending: true, nullsFirst: false })
  if (!error) return applyClientOrder((data as DbProject[]).map(mapRow))

  // Column likely does not exist yet — fall back to created_at
  const { data: d2, error: e2 } = await base().order('created_at', { ascending: false })
  if (e2) throw e2
  return applyClientOrder((d2 as DbProject[]).map(mapRow))
}

// ── Public list functions ─────────────────────────────────────────────────────

/** Public pages: excludes hidden projects. */
export async function listProjects(): Promise<Project[]> {
  if (!supabase) {
    const saved = loadProjectOrder()
    const visible = mockStore.filter((p) => !p.isHidden)
    return applyOrder(visible, saved)
  }
  return queryProjects((q) => q.eq('is_hidden', false))
}

/** Public pages: filters by whether the `categories` array contains the given category. */
export async function listProjectsByCategory(category: ProjectCategory): Promise<Project[]> {
  const catOrder = loadCategoryProjectOrder(category)
  const globalOrder = loadProjectOrder()

  if (!supabase) {
    const visible = mockStore.filter((p) => !p.isHidden && p.categories.includes(category))
    return applyOrder(visible, catOrder ?? globalOrder)
  }

  const projects = await queryProjects((q) =>
    q.eq('is_hidden', false).filter('categories', 'cs', `{"${category}"}`),
  )
  if (catOrder && catOrder.length > 0) return applyOrder(projects, catOrder)
  return projects
}

/**
 * Homepage: returns visible featured projects in featured_order.
 * Falls back to all visible projects if none are marked featured.
 */
export async function listFeaturedProjects(): Promise<Project[]> {
  const featuredOrder = loadFeaturedOrder()

  if (!supabase) {
    const featured = mockStore.filter((p) => !p.isHidden && p.isFeatured)
    if (featured.length === 0) return applyOrder(mockStore.filter((p) => !p.isHidden), loadProjectOrder())
    return applyOrder(featured, featuredOrder)
  }

  // Try ordering by featured_order column
  const base = supabase
    .from('projects')
    .select('*, project_images(image_url, sort_order)')
    .eq('is_hidden', false)
    .eq('is_featured', true)

  const { data, error } = await base.order('featured_order', { ascending: true, nullsFirst: false })
  if (!error && data) {
    const rows = (data as DbProject[]).map(mapRow)
    if (rows.length === 0) return listProjects()
    return applyOrder(rows, featuredOrder)
  }

  // featured_order column may not exist yet — fall back
  const { data: d2, error: e2 } = await supabase
    .from('projects')
    .select('*, project_images(image_url, sort_order)')
    .eq('is_hidden', false)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
  if (e2) throw e2
  const rows2 = (d2 as DbProject[]).map(mapRow)
  if (rows2.length === 0) return listProjects()
  return applyOrder(rows2, featuredOrder)
}

/** Admin only: all projects, including hidden. */
export async function listAllProjectsForAdmin(): Promise<Project[]> {
  if (!supabase) {
    const saved = loadProjectOrder()
    return applyOrder([...mockStore], saved)
  }
  return queryProjects((q) => q)
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!supabase) return mockStore.find((p) => p.slug === slug) ?? null

  const { data, error } = await supabase
    .from('projects')
    .select('*, project_images(image_url, sort_order)')
    .eq('slug', slug)
    .single()

  if (error) return null
  return mapRow(data as DbProject)
}

// ── Create / Update / Delete ──────────────────────────────────────────────────

export async function createProject(input: NewProjectInput): Promise<Project> {
  const thumbnail = input.thumbnailFile
    ? await uploadImage(STORAGE_BUCKETS.projectThumbnails, input.thumbnailFile)
    : ''

  const galleryUrls = input.galleryFiles.length
    ? await uploadImages(STORAGE_BUCKETS.projectGallery, input.galleryFiles)
    : []

  if (!supabase) {
    const project: Project = {
      id: `p-${Date.now()}`,
      title: input.title,
      slug: input.slug,
      categories: input.categories,
      thumbnail,
      embedType: input.embedType,
      embedUrl: input.embedUrl,
      galleryImages: galleryUrls,
      isHidden: input.isHidden ?? false,
      isFeatured: input.isFeatured ?? false,
      featuredOrder: null,
      description: input.description,
      year: input.year,
      createdAt: new Date().toISOString(),
    }
    mockStore.unshift(project)
    return project
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: input.title,
      slug: input.slug,
      categories: input.categories,
      embed_type: input.embedType,
      embed_url: input.embedUrl,
      thumbnail_url: thumbnail,
      is_hidden: input.isHidden ?? false,
      is_featured: input.isFeatured ?? false,
      featured_order: null,
      description: input.description ?? null,
      year: input.year ?? null,
    })
    .select()
    .single()

  if (error) throw error
  const created = data as DbProject

  if (galleryUrls.length) {
    const { error: imgError } = await supabase.from('project_images').insert(
      galleryUrls.map((url, i) => ({
        project_id: created.id,
        image_url: url,
        sort_order: i,
      })),
    )
    if (imgError) throw imgError
  }

  return mapRow({
    ...created,
    project_images: galleryUrls.map((url, i) => ({ image_url: url, sort_order: i })),
  })
}

export async function updateProject(input: EditProjectInput): Promise<Project> {
  const thumbnail = input.thumbnailFile
    ? await uploadImage(STORAGE_BUCKETS.projectThumbnails, input.thumbnailFile)
    : input.thumbnailExistingUrl

  const newGalleryUrls = input.galleryNewFiles.length
    ? await uploadImages(STORAGE_BUCKETS.projectGallery, input.galleryNewFiles)
    : []

  const finalGallery = [...input.galleryExistingUrls, ...newGalleryUrls]

  if (!supabase) {
    const idx = mockStore.findIndex((p) => p.id === input.id)
    if (idx === -1) throw new Error('Project not found.')
    const updated: Project = {
      ...mockStore[idx],
      title: input.title,
      slug: input.slug,
      categories: input.categories,
      embedType: input.embedType,
      embedUrl: input.embedUrl,
      thumbnail,
      galleryImages: finalGallery,
      isHidden: input.isHidden,
      isFeatured: input.isFeatured,
      description: input.description,
      year: input.year,
    }
    mockStore[idx] = updated
    return updated
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      title: input.title,
      slug: input.slug,
      categories: input.categories,
      embed_type: input.embedType,
      embed_url: input.embedUrl,
      thumbnail_url: thumbnail,
      is_hidden: input.isHidden,
      is_featured: input.isFeatured,
      description: input.description ?? null,
      year: input.year ?? null,
    })
    .eq('id', input.id)
    .select()
    .single()

  if (error) throw error

  await supabase.from('project_images').delete().eq('project_id', input.id)

  if (finalGallery.length) {
    const { error: imgError } = await supabase.from('project_images').insert(
      finalGallery.map((url, i) => ({
        project_id: input.id,
        image_url: url,
        sort_order: i,
      })),
    )
    if (imgError) throw imgError
  }

  return mapRow({
    ...(data as DbProject),
    project_images: finalGallery.map((url, i) => ({ image_url: url, sort_order: i })),
  })
}

export async function deleteProject(id: string): Promise<void> {
  if (!supabase) {
    const idx = mockStore.findIndex((p) => p.id === id)
    if (idx !== -1) mockStore.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── Featured toggle ───────────────────────────────────────────────────────────

export async function toggleProjectFeatured(id: string, isFeatured: boolean): Promise<void> {
  if (!supabase) {
    const p = mockStore.find((p) => p.id === id)
    if (p) {
      p.isFeatured = isFeatured
      if (!isFeatured) p.featuredOrder = null
    }
    return
  }
  const update: Record<string, unknown> = { is_featured: isFeatured }
  if (!isFeatured) update.featured_order = null
  const { error } = await supabase.from('projects').update(update).eq('id', id)
  if (error) throw error
}

// ── Ordering: global ──────────────────────────────────────────────────────────

const PROJECT_ORDER_KEY = 'admin_project_order'

export function saveProjectOrder(ids: string[]): void {
  localStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(ids))
}

export function loadProjectOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(PROJECT_ORDER_KEY)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

/** Persists the drag order to Supabase (sort_order column) and localStorage. */
export async function reorderProjects(ids: string[]): Promise<void> {
  saveProjectOrder(ids)

  if (!supabase) {
    const map = new Map(mockStore.map((p) => [p.id, p]))
    const ordered = ids.map((id) => map.get(id)).filter((p): p is Project => !!p)
    const rest = mockStore.filter((p) => !ids.includes(p.id))
    mockStore.splice(0, mockStore.length, ...ordered, ...rest)
    return
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase!.from('projects').update({ sort_order: index }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export async function toggleProjectVisibility(id: string, isHidden: boolean): Promise<void> {
  if (!supabase) {
    const p = mockStore.find((p) => p.id === id)
    if (p) p.isHidden = isHidden
    return
  }
  const { error } = await supabase.from('projects').update({ is_hidden: isHidden }).eq('id', id)
  if (error) throw error
}

// ── Ordering: per-category ────────────────────────────────────────────────────

const CATEGORY_ORDER_KEY_PREFIX = 'admin_project_order_cat_'

export function saveCategoryProjectOrder(category: ProjectCategory, ids: string[]): void {
  localStorage.setItem(`${CATEGORY_ORDER_KEY_PREFIX}${category}`, JSON.stringify(ids))
}

export function loadCategoryProjectOrder(category: ProjectCategory): string[] | null {
  try {
    const raw = localStorage.getItem(`${CATEGORY_ORDER_KEY_PREFIX}${category}`)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

// ── Ordering: featured (homepage) ─────────────────────────────────────────────

const FEATURED_ORDER_KEY = 'admin_featured_order'

export function saveFeaturedOrder(ids: string[]): void {
  localStorage.setItem(FEATURED_ORDER_KEY, JSON.stringify(ids))
}

export function loadFeaturedOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(FEATURED_ORDER_KEY)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

/** Persists featured order to Supabase (featured_order column) and localStorage. */
export async function reorderFeatured(ids: string[]): Promise<void> {
  saveFeaturedOrder(ids)

  if (!supabase) {
    ids.forEach((id, index) => {
      const p = mockStore.find((p) => p.id === id)
      if (p) p.featuredOrder = index
    })
    return
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase!.from('projects').update({ featured_order: index }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
