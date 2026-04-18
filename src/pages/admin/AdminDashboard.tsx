import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useArchive } from '@/hooks/useArchive'
import { useProjects } from '@/hooks/useProjects'
import {
  createArchiveItem,
  deleteArchiveItem,
  deleteProject,
  loadArchiveOrder,
  loadCategoryProjectOrder,
  loadFeaturedOrder,
  reorderFeatured,
  reorderProjects,
  saveArchiveOrder,
  saveCategoryProjectOrder,
  saveFeaturedOrder,
  toggleProjectFeatured,
  toggleProjectVisibility,
} from '@/services'
import type { ArchiveItem, Project, ProjectCategory } from '@/types'
import { PROJECT_CATEGORY_LABEL } from '@/types'

const ALL_CATEGORIES: ProjectCategory[] = ['music-videos', 'ai-works', 'commercials', 'experiments']

const btnBase = 'text-[10px] uppercase tracking-[0.2em] transition-colors duration-150'
const btnMuted = `${btnBase} text-white/40 hover:text-white/80`

// ── Drag handle icon ──────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <circle cx="4" cy="2.5" r="1" />
      <circle cx="8" cy="2.5" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9.5" r="1" />
      <circle cx="8" cy="9.5" r="1" />
    </svg>
  )
}

// ── Sortable project card ─────────────────────────────────────────────────────
type SortableProjectCardProps = {
  p: Project
  deletingId: string | null
  togglingId: string | null
  featureTogglingId: string | null
  onDelete: (id: string) => void
  onToggle: (id: string, hidden: boolean) => void
  onFeatureToggle: (id: string, currentlyFeatured: boolean) => void
}

function SortableProjectCard({
  p,
  deletingId,
  togglingId,
  featureTogglingId,
  onDelete,
  onToggle,
  onFeatureToggle,
}: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
  })

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={`border bg-white/[0.02] p-3 ${p.isHidden ? 'border-white/5 opacity-50' : 'border-white/10'}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="mb-2 flex cursor-grab touch-none items-center gap-1.5 text-white/20 hover:text-white/50 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripIcon />
        <span className="text-[9px] uppercase tracking-[0.22em]">Drag to reorder</span>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-black">
        {p.thumbnail ? (
          <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
        {p.isHidden ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/60">Hidden</span>
          </div>
        ) : null}
        {p.isFeatured ? (
          <div className="absolute right-1.5 top-1.5 bg-amber-400/20 px-1.5 py-0.5">
            <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400">★ Featured</span>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm text-white">{p.title}</h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/40">
            {p.categories.map((c) => PROJECT_CATEGORY_LABEL[c] ?? c).join(' · ')}
            {p.year ? ` · ${p.year}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            disabled={featureTogglingId === p.id}
            onClick={() => onFeatureToggle(p.id, p.isFeatured)}
            title={p.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
            className={`${btnBase} ${
              p.isFeatured
                ? 'text-amber-400/80 hover:text-amber-400'
                : 'text-white/30 hover:text-white/70'
            }`}
          >
            {p.isFeatured ? '★' : '☆'}
          </button>
          <Link to={`/admin/projects/${p.id}/edit`} className={btnMuted}>
            Edit
          </Link>
          <button
            type="button"
            disabled={togglingId === p.id}
            onClick={() => onToggle(p.id, p.isHidden)}
            className={btnMuted}
          >
            {p.isHidden ? 'Show' : 'Hide'}
          </button>
          <button
            type="button"
            disabled={deletingId === p.id}
            onClick={() => onDelete(p.id)}
            className={`${btnBase} text-red-400/60 hover:text-red-400`}
          >
            {deletingId === p.id ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Sortable archive item ─────────────────────────────────────────────────────
type SortableArchiveItemProps = {
  item: ArchiveItem
  deletingId: string | null
  onDelete: (id: string) => void
}

function SortableArchiveItem({ item, deletingId, onDelete }: SortableArchiveItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      {...attributes}
      {...listeners}
      className="group relative aspect-square cursor-grab touch-none overflow-hidden bg-black active:cursor-grabbing"
    >
      <img src={item.imageUrl} alt={item.title ?? ''} className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/60">
        <button
          type="button"
          disabled={deletingId === item.id}
          onClick={() => onDelete(item.id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="scale-90 text-[10px] uppercase tracking-[0.22em] text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
          aria-label="Delete image"
        >
          {deletingId === item.id ? '…' : 'Delete'}
        </button>
      </div>
      {item.title ? (
        <p className="absolute bottom-0 left-0 right-0 truncate bg-black/70 px-1.5 py-1 text-[9px] uppercase tracking-[0.2em] text-white/70">
          {item.title}
        </p>
      ) : null}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { projects, loading: projectsLoading, setProjects } = useProjects({ includeHidden: true })
  const { items: archive, setItems: setArchive, loading: archiveLoading } = useArchive()

  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [togglingProjectId, setTogglingProjectId] = useState<string | null>(null)
  const [featureTogglingId, setFeatureTogglingId] = useState<string | null>(null)
  const [deletingArchiveId, setDeletingArchiveId] = useState<string | null>(null)
  const [archiveUploading, setArchiveUploading] = useState(false)

  // Category ordering state
  const [catOrders, setCatOrders] = useState<Partial<Record<ProjectCategory, string[]>>>({})
  const [projectsReordered, setProjectsReordered] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderSaved, setOrderSaved] = useState(false)
  const [orderSaveError, setOrderSaveError] = useState<string | null>(null)

  // Featured ordering state (independent from category ordering)
  const [featuredOrder, setFeaturedOrder] = useState<string[]>([])
  const [featuredReordered, setFeaturedReordered] = useState(false)
  const [savingFeaturedOrder, setSavingFeaturedOrder] = useState(false)
  const [featuredOrderSaved, setFeaturedOrderSaved] = useState(false)

  const orderApplied = useRef(false)
  const archiveOrderApplied = useRef(false)

  // Load all saved orders from localStorage once projects are available
  useEffect(() => {
    if (!projectsLoading && !orderApplied.current) {
      orderApplied.current = true

      const loaded: Partial<Record<ProjectCategory, string[]>> = {}
      for (const cat of ALL_CATEGORIES) {
        const order = loadCategoryProjectOrder(cat)
        if (order && order.length > 0) loaded[cat] = order
      }
      setCatOrders(loaded)

      const fo = loadFeaturedOrder()
      if (fo && fo.length > 0) setFeaturedOrder(fo)
    }
  }, [projectsLoading])

  useEffect(() => {
    if (!archiveLoading && !archiveOrderApplied.current) {
      archiveOrderApplied.current = true
      const saved = loadArchiveOrder()
      if (saved && saved.length > 0) {
        setArchive((curr) => {
          const map = new Map(curr.map((i) => [i.id, i]))
          const ordered = saved.map((id) => map.get(id)).filter((i): i is ArchiveItem => !!i)
          const extra = curr.filter((i) => !saved.includes(i.id))
          return [...ordered, ...extra]
        })
      }
    }
  }, [archiveLoading, setArchive])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── Featured derived list ────────────────────────────────────────────────────

  const featuredProjects = useMemo(() => {
    const featured = projects.filter((p) => p.isFeatured)
    if (featuredOrder.length === 0) return featured
    const map = new Map(featured.map((p) => [p.id, p]))
    const sorted = featuredOrder.map((id) => map.get(id)).filter((p): p is Project => !!p)
    const rest = featured.filter((p) => !featuredOrder.includes(p.id))
    return [...sorted, ...rest]
  }, [projects, featuredOrder])

  // ── Category derived lists ───────────────────────────────────────────────────

  const getCategoryProjects = useCallback(
    (cat: ProjectCategory): Project[] => {
      const catProjects = projects.filter((p) => p.categories.includes(cat))
      const order = catOrders[cat]
      if (!order || order.length === 0) return catProjects
      const map = new Map(catProjects.map((p) => [p.id, p]))
      const sorted = order.map((id) => map.get(id)).filter((p): p is Project => !!p)
      const rest = catProjects.filter((p) => !order.includes(p.id))
      return [...sorted, ...rest]
    },
    [projects, catOrders],
  )

  const projectsByCategory = useMemo(
    () =>
      ALL_CATEGORIES.reduce(
        (acc, cat) => {
          acc[cat] = getCategoryProjects(cat)
          return acc
        },
        {} as Record<ProjectCategory, Project[]>,
      ),
    [getCategoryProjects],
  )

  // ── Featured drag-and-drop ───────────────────────────────────────────────────

  const handleFeaturedDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = featuredProjects.findIndex((p) => p.id === active.id)
      const newIndex = featuredProjects.findIndex((p) => p.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(featuredProjects, oldIndex, newIndex)
      const newIds = reordered.map((p) => p.id)

      saveFeaturedOrder(newIds)
      setFeaturedOrder(newIds)
      setFeaturedReordered(true)
      setFeaturedOrderSaved(false)
    },
    [featuredProjects],
  )

  const handleSaveFeaturedOrder = async () => {
    setSavingFeaturedOrder(true)
    try {
      await reorderFeatured(featuredProjects.map((p) => p.id))
      setFeaturedOrderSaved(true)
      setFeaturedReordered(false)
    } finally {
      setSavingFeaturedOrder(false)
    }
  }

  // ── Category drag-and-drop ───────────────────────────────────────────────────

  const makeCategoryDragEnd = useCallback(
    (cat: ProjectCategory) => (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const current = getCategoryProjects(cat)
      const oldIndex = current.findIndex((p) => p.id === active.id)
      const newIndex = current.findIndex((p) => p.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(current, oldIndex, newIndex)
      const newIds = reordered.map((p) => p.id)

      saveCategoryProjectOrder(cat, newIds)
      setCatOrders((prev) => ({ ...prev, [cat]: newIds }))
      setProjectsReordered(true)
      setOrderSaved(false)
    },
    [getCategoryProjects],
  )

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    setOrderSaveError(null)
    try {
      await reorderProjects(projects.map((p) => p.id))
      setOrderSaved(true)
      setProjectsReordered(false)
    } catch (err) {
      setOrderSaveError(err instanceof Error ? err.message : 'Failed to save order.')
    } finally {
      setSavingOrder(false)
    }
  }

  // ── Archive drag-and-drop ────────────────────────────────────────────────────

  const handleArchiveDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setArchive((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      const reordered = arrayMove(items, oldIndex, newIndex)
      saveArchiveOrder(reordered.map((i) => i.id))
      return reordered
    })
  }

  // ── Project actions ──────────────────────────────────────────────────────────

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    setDeletingProjectId(id)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setFeaturedOrder((prev) => prev.filter((fid) => fid !== id))
    } finally {
      setDeletingProjectId(null)
    }
  }

  const handleToggleHidden = async (id: string, currentlyHidden: boolean) => {
    setTogglingProjectId(id)
    try {
      await toggleProjectVisibility(id, !currentlyHidden)
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isHidden: !currentlyHidden } : p)))
    } finally {
      setTogglingProjectId(null)
    }
  }

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    setFeatureTogglingId(id)
    try {
      await toggleProjectFeatured(id, !currentlyFeatured)
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !currentlyFeatured } : p)),
      )
      if (!currentlyFeatured) {
        // Add to end of featured order
        setFeaturedOrder((prev) => [...prev.filter((fid) => fid !== id), id])
      } else {
        setFeaturedOrder((prev) => prev.filter((fid) => fid !== id))
      }
    } finally {
      setFeatureTogglingId(null)
    }
  }

  // ── Archive actions ──────────────────────────────────────────────────────────

  const handleDeleteArchive = async (id: string) => {
    setDeletingArchiveId(id)
    try {
      await deleteArchiveItem(id)
      setArchive((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setDeletingArchiveId(null)
    }
  }

  const handleArchiveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (!files.length) return
    setArchiveUploading(true)
    try {
      const created = await Promise.all(files.map((f) => createArchiveItem({ imageFile: f })))
      setArchive((prev) => [...created, ...prev])
    } finally {
      setArchiveUploading(false)
      e.target.value = ''
    }
  }

  // ── Shared card props factory ────────────────────────────────────────────────

  const sharedCardProps = {
    deletingId: deletingProjectId,
    togglingId: togglingProjectId,
    featureTogglingId,
    onDelete: handleDeleteProject,
    onToggle: handleToggleHidden,
    onFeatureToggle: handleToggleFeatured,
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-16">
      {/* ── Projects ── */}
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-[-0.02em] text-white">Projects</h2>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-white/40">
              {projectsLoading ? 'Loading…' : `${projects.length} total`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(projectsReordered || orderSaved) && !projectsLoading ? (
              <button
                type="button"
                disabled={savingOrder || orderSaved}
                onClick={handleSaveOrder}
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors ${
                  orderSaved
                    ? 'border border-white/10 text-white/30 cursor-default'
                    : 'border border-white/40 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50'
                }`}
              >
                {savingOrder ? 'Saving…' : orderSaved ? '✓ Order saved' : 'Save order'}
              </button>
            ) : null}
            <Link
              to="/admin/projects/new"
              className="border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              + New project
            </Link>
          </div>
        </div>

        {projectsLoading ? (
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">Loading…</p>
        ) : (
          <div className="space-y-10">

            {/* ── Featured / Homepage ── */}
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-amber-400/[0.12] pb-2">
                <h3 className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
                  ★ Featured · Homepage
                  <span className="ml-2 text-amber-400/40">({featuredProjects.length})</span>
                </h3>
                {(featuredReordered || featuredOrderSaved) ? (
                  <button
                    type="button"
                    disabled={savingFeaturedOrder || featuredOrderSaved}
                    onClick={handleSaveFeaturedOrder}
                    className={`px-3 py-1 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                      featuredOrderSaved
                        ? 'text-amber-400/30 cursor-default'
                        : 'border border-amber-400/30 text-amber-400/70 hover:border-amber-400/60 hover:text-amber-400 disabled:opacity-50'
                    }`}
                  >
                    {savingFeaturedOrder ? 'Saving…' : featuredOrderSaved ? '✓ Saved' : 'Save order'}
                  </button>
                ) : null}
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFeaturedDragEnd}
              >
                <SortableContext
                  items={featuredProjects.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {featuredProjects.map((p) => (
                      <SortableProjectCard key={p.id} p={p} {...sharedCardProps} />
                    ))}
                    {featuredProjects.length === 0 ? (
                      <p className="col-span-full py-4 text-[11px] text-white/25">
                        No featured projects yet. Click ☆ on any project below to feature it on the homepage.
                      </p>
                    ) : null}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* ── Per-category sections ── */}
            {ALL_CATEGORIES.map((cat) => {
              const catProjects = projectsByCategory[cat]
              return (
                <div key={cat}>
                  <h3 className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/30 border-b border-white/[0.06] pb-2">
                    {PROJECT_CATEGORY_LABEL[cat]}
                    <span className="ml-2 text-white/20">({catProjects.length})</span>
                  </h3>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={makeCategoryDragEnd(cat)}
                  >
                    <SortableContext
                      items={catProjects.map((p) => p.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {catProjects.map((p) => (
                          <SortableProjectCard key={p.id} p={p} {...sharedCardProps} />
                        ))}
                        {catProjects.length === 0 ? (
                          <p className="col-span-full py-4 text-[11px] text-white/25">
                            No projects in this category yet.
                          </p>
                        ) : null}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )
            })}
          </div>
        )}

        {orderSaveError ? (
          <div className="mt-4 border border-red-400/30 bg-red-400/5 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-400">
              Could not save order to database
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/60 p-3 text-[11px] text-white/60">
              {orderSaveError}
            </pre>
            <details className="text-xs text-white/40">
              <summary className="cursor-pointer hover:text-white/60">Need the sort_order column?</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/60 p-3 text-[11px] text-white/60">
                {`ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;\nALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;\nALTER TABLE projects ADD COLUMN IF NOT EXISTS featured_order integer;`}
              </pre>
            </details>
          </div>
        ) : null}
      </section>

      {/* ── Archive ── */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-[-0.02em] text-white">Archive</h2>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-white/40">
              {archiveLoading ? 'Loading…' : `${archive.length} images`}
            </p>
          </div>
          <label className="cursor-pointer border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:border-white/40 hover:bg-white/5">
            {archiveUploading ? 'Uploading…' : '+ Upload'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleArchiveUpload}
              disabled={archiveUploading}
            />
          </label>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArchiveDragEnd}>
          <SortableContext items={archive.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
              {archive.map((item) => (
                <SortableArchiveItem
                  key={item.id}
                  item={item}
                  deletingId={deletingArchiveId}
                  onDelete={handleDeleteArchive}
                />
              ))}
              {!archiveLoading && archive.length === 0 ? (
                <p className="col-span-full text-sm text-white/50">No archive images yet.</p>
              ) : null}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  )
}
