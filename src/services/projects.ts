import { projectsSeed } from '@/data'
import type {
  EditProjectInput,
  GalleryMediaItem,
  NewProjectInput,
  Project,
  ProjectCategory,
  ProjectGalleryEditorItem,
} from '@/types'

import { uploadImage, uploadImages } from './storage'
import { STORAGE_BUCKETS, supabase } from './supabase'

const mockStore: Project[] = projectsSeed.map((p) => ({ ...p }))

/** PostgREST embed; fails if FK relationship is missing from API schema — we fall back to a separate query. */
const PROJECT_SELECT_WITH_IMAGES = '*, project_images(image_url, sort_order)'

/** Run in Supabase SQL Editor if remote DB was created before gallery_media existed (fixes PGRST204 on insert/update). */
const SQL_ADD_GALLERY_MEDIA = `alter table if exists public.projects
  add column if not exists gallery_media jsonb not null default '[]'::jsonb;`

function throwIfMissingGalleryMediaColumn(error: { code?: string; message?: string } | null | undefined): void {
  if (!error) return
  if (error.code === 'PGRST204' && (error.message ?? '').includes('gallery_media')) {
    throw new Error(
      `Your Supabase database is missing the gallery_media column on projects. In Dashboard → SQL → New query, run:\n\n${SQL_ADD_GALLERY_MEDIA}\n\nThen save again. If you still see errors, wait ~30 seconds for the API schema cache to refresh.`,
    )
  }
}

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
  /** JSON array of GalleryMediaItem — optional until migration is applied. */
  gallery_media?: GalleryMediaItem[] | null
  project_images: { image_url: string; sort_order: number }[]
}

function mapGalleryFromRow(row: DbProject): GalleryMediaItem[] {
  const raw = row.gallery_media
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as GalleryMediaItem[]
  }
  return [...(row.project_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({ type: 'image' as const, url: img.image_url }))
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
    galleryMedia: mapGalleryFromRow(row),
    description: row.description ?? undefined,
    year: row.year ?? undefined,
    createdAt: row.created_at,
  }
}

function collectNewGalleryFiles(items: ProjectGalleryEditorItem[]): File[] {
  return items
    .filter((i): i is Extract<ProjectGalleryEditorItem, { kind: 'new' }> => i.kind === 'new')
    .map((i) => i.file)
}

/** Builds ordered gallery from editor state + uploaded URLs for each new image (in order). */
function buildGalleryMediaFromEditor(
  items: ProjectGalleryEditorItem[],
  uploadedNewUrls: string[],
): GalleryMediaItem[] {
  let u = 0
  const out: GalleryMediaItem[] = []
  for (const item of items) {
    if (item.kind === 'existing') {
      out.push({ type: 'image', url: item.url })
    } else if (item.kind === 'new') {
      const url = uploadedNewUrls[u++]
      if (url) out.push({ type: 'image', url })
    } else {
      const url = item.embedUrl.trim()
      if (url) {
        out.push({ type: 'video', embedType: item.embedType, embedUrl: url })
      }
    }
  }
  return out
}

async function fetchImagesByProjectIds(
  projectIds: string[],
): Promise<Map<string, { image_url: string; sort_order: number }[]>> {
  const map = new Map<string, { image_url: string; sort_order: number }[]>()
  if (projectIds.length === 0 || !supabase) return map

  const { data, error } = await supabase
    .from('project_images')
    .select('project_id, image_url, sort_order')
    .in('project_id', projectIds)

  if (error || !data) return map

  for (const row of data) {
    const pid = row.project_id as string
    const list = map.get(pid) ?? []
    list.push({
      image_url: row.image_url as string,
      sort_order: row.sort_order as number,
    })
    map.set(pid, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order)
  }
  return map
}

async function attachProjectImages(rows: DbProject[]): Promise<DbProject[]> {
  const byProject = await fetchImagesByProjectIds(rows.map((r) => r.id))
  return rows.map((r) => ({
    ...r,
    project_images: byProject.get(r.id) ?? r.project_images ?? [],
  }))
}

/**
 * Run a Supabase projects query ordered by sort_order first.
 * Falls back to created_at desc if sort_order column does not exist yet.
 * If nested `project_images` embed fails (400: missing relationship in API), uses select('*') + batch images.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryProjects(apply: (q: any) => any): Promise<Project[]> {
  const fetchRows = async (selectClause: string): Promise<DbProject[]> => {
    const base = () => apply(supabase!.from('projects').select(selectClause))

    // Do not pass nullsFirst — PostgREST appends .nullslast/.nullsfirst to `order`, which some deployments reject with 400.
    const { data, error } = await base().order('sort_order', { ascending: true })
    if (!error && data) return data as DbProject[]

    const { data: d2, error: e2 } = await base().order('created_at', { ascending: false })
    if (e2) throw e2
    return (d2 ?? []) as DbProject[]
  }

  let rows: DbProject[]
  try {
    rows = await fetchRows(PROJECT_SELECT_WITH_IMAGES)
  } catch {
    rows = await fetchRows('*')
    rows = await attachProjectImages(rows)
  }
  return applyClientOrder(rows.map(mapRow))
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

  // `.contains([x])` builds `cs.{x}` without quotes — invalid for hyphenated text[] values; use explicit array literal.
  const categoriesLiteral = `{${[category]
    .map((c) => `"${String(c).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',')}}`
  const projects = await queryProjects((q) =>
    q.eq('is_hidden', false).filter('categories', 'cs', categoriesLiteral),
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

  const fetchFeaturedRows = async (selectClause: string): Promise<DbProject[]> => {
    const mk = () =>
      supabase!
        .from('projects')
        .select(selectClause)
        .eq('is_hidden', false)
        .eq('is_featured', true)

    const { data, error } = await mk().order('featured_order', { ascending: true })
    if (!error && data) return data as unknown as DbProject[]

    const { data: d2, error: e2 } = await mk().order('created_at', { ascending: false })
    if (e2) throw e2
    return (d2 ?? []) as unknown as DbProject[]
  }

  let dbRows: DbProject[]
  try {
    dbRows = await fetchFeaturedRows(PROJECT_SELECT_WITH_IMAGES)
  } catch {
    dbRows = await fetchFeaturedRows('*')
    dbRows = await attachProjectImages(dbRows)
  }

  const rows = dbRows.map(mapRow)
  if (rows.length === 0) return listProjects()
  return applyOrder(rows, featuredOrder)
}

/** Admin only: all projects, including hidden. */
export async function listAllProjectsForAdmin(): Promise<Project[]> {
  if (!supabase) {
    const saved = loadProjectOrder()
    return applyOrder([...mockStore], saved)
  }
  return queryProjects((q) => q)
}

/** Load one row by primary key (embed + fallback). Used after insert/update to avoid RETURNING column-list 400s. */
async function fetchDbProjectById(id: string): Promise<DbProject | null> {
  if (!supabase) return null

  const embedded = await supabase
    .from('projects')
    .select(PROJECT_SELECT_WITH_IMAGES)
    .eq('id', id)
    .single()

  if (!embedded.error && embedded.data) {
    return embedded.data as DbProject
  }

  const bare = await supabase.from('projects').select('*').eq('id', id).single()
  if (bare.error || !bare.data) return null

  const row = bare.data as DbProject
  const imgs = await fetchImagesByProjectIds([row.id])
  return {
    ...row,
    project_images: imgs.get(row.id) ?? [],
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!supabase) return mockStore.find((p) => p.slug === slug) ?? null

  const embedded = await supabase
    .from('projects')
    .select(PROJECT_SELECT_WITH_IMAGES)
    .eq('slug', slug)
    .single()

  if (!embedded.error && embedded.data) {
    return mapRow(embedded.data as DbProject)
  }

  const bare = await supabase.from('projects').select('*').eq('slug', slug).single()
  if (bare.error || !bare.data) return null

  const row = bare.data as DbProject
  const imgs = await fetchImagesByProjectIds([row.id])
  return mapRow({
    ...row,
    project_images: imgs.get(row.id) ?? [],
  })
}

// ── Create / Update / Delete ──────────────────────────────────────────────────

export async function createProject(input: NewProjectInput): Promise<Project> {
  const thumbnail = input.thumbnailFile
    ? await uploadImage(STORAGE_BUCKETS.projectThumbnails, input.thumbnailFile)
    : ''

  const newFiles = collectNewGalleryFiles(input.galleryItems)
  const uploadedNewUrls = newFiles.length
    ? await uploadImages(STORAGE_BUCKETS.projectGallery, newFiles)
    : []

  const galleryMedia = buildGalleryMediaFromEditor(input.galleryItems, uploadedNewUrls)
  const imageOnlyRows = galleryMedia
    .filter((m): m is Extract<GalleryMediaItem, { type: 'image' }> => m.type === 'image')
    .map((m, i) => ({ image_url: m.url, sort_order: i }))

  if (!supabase) {
    const project: Project = {
      id: `p-${Date.now()}`,
      title: input.title,
      slug: input.slug,
      categories: input.categories,
      thumbnail,
      embedType: input.embedType,
      embedUrl: input.embedUrl,
      galleryMedia,
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

  const { data: inserted, error } = await supabase
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
      gallery_media: galleryMedia,
    })
    .select('id')
    .single()

  throwIfMissingGalleryMediaColumn(error)
  if (error) throw error
  const created = await fetchDbProjectById(inserted.id)
  if (!created) throw new Error('Project was created but could not be loaded. Check Supabase policies and schema.')

  await supabase.from('project_images').delete().eq('project_id', created.id)
  if (imageOnlyRows.length) {
    const { error: imgError } = await supabase.from('project_images').insert(
      imageOnlyRows.map((row, i) => ({
        project_id: created.id,
        image_url: row.image_url,
        sort_order: i,
      })),
    )
    if (imgError) throw imgError
  }

  return mapRow({
    ...created,
    gallery_media: galleryMedia,
    project_images: imageOnlyRows.map((row, i) => ({ image_url: row.image_url, sort_order: i })),
  })
}

export async function updateProject(input: EditProjectInput): Promise<Project> {
  const thumbnail = input.thumbnailFile
    ? await uploadImage(STORAGE_BUCKETS.projectThumbnails, input.thumbnailFile)
    : input.thumbnailExistingUrl

  const newFiles = collectNewGalleryFiles(input.galleryItems)
  const uploadedNewUrls = newFiles.length
    ? await uploadImages(STORAGE_BUCKETS.projectGallery, newFiles)
    : []

  const galleryMedia = buildGalleryMediaFromEditor(input.galleryItems, uploadedNewUrls)
  const imageOnlyRows = galleryMedia
    .filter((m): m is Extract<GalleryMediaItem, { type: 'image' }> => m.type === 'image')
    .map((m, i) => ({ image_url: m.url, sort_order: i }))

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
      galleryMedia,
      isHidden: input.isHidden,
      isFeatured: input.isFeatured,
      description: input.description,
      year: input.year,
    }
    mockStore[idx] = updated
    return updated
  }

  const { error: updateErr } = await supabase
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
      gallery_media: galleryMedia,
    })
    .eq('id', input.id)

  throwIfMissingGalleryMediaColumn(updateErr)
  if (updateErr) throw updateErr

  const data = await fetchDbProjectById(input.id)
  if (!data) throw new Error('Project was updated but could not be reloaded.')

  await supabase.from('project_images').delete().eq('project_id', input.id)

  if (imageOnlyRows.length) {
    const { error: imgError } = await supabase.from('project_images').insert(
      imageOnlyRows.map((row, i) => ({
        project_id: input.id,
        image_url: row.image_url,
        sort_order: i,
      })),
    )
    if (imgError) throw imgError
  }

  return mapRow({
    ...data,
    gallery_media: galleryMedia,
    project_images: imageOnlyRows.map((row, i) => ({ image_url: row.image_url, sort_order: i })),
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
