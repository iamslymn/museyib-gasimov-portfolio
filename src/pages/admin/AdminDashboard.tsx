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
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useArchive } from '@/hooks/useArchive'
import { useProjects } from '@/hooks/useProjects'
import {
  createArchiveItem,
  deleteArchiveItem,
  deleteProject,
  loadArchiveOrder,
  loadProjectOrder,
  saveArchiveOrder,
  saveProjectOrder,
  toggleProjectVisibility,
} from '@/services'
import type { ArchiveItem, Project } from '@/types'
import { PROJECT_CATEGORY_LABEL } from '@/types'

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
  onDelete: (id: string) => void
  onToggle: (id: string, hidden: boolean) => void
}

function SortableProjectCard({ p, deletingId, togglingId, onDelete, onToggle }: SortableProjectCardProps) {
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
      {/* Drag handle bar */}
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
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm text-white">{p.title}</h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/40">
            {p.categories.map((c) => PROJECT_CATEGORY_LABEL[c]).join(' · ')}
            {p.year ? ` · ${p.year}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
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
  const [deletingArchiveId, setDeletingArchiveId] = useState<string | null>(null)
  const [archiveUploading, setArchiveUploading] = useState(false)

  // Apply saved sort order once after initial load
  const projectOrderApplied = useRef(false)
  const archiveOrderApplied = useRef(false)

  useEffect(() => {
    if (!projectsLoading && !projectOrderApplied.current) {
      projectOrderApplied.current = true
      const saved = loadProjectOrder()
      if (saved && saved.length > 0) {
        setProjects((curr) => {
          const map = new Map(curr.map((p) => [p.id, p]))
          const ordered = saved.map((id) => map.get(id)).filter((p): p is Project => !!p)
          const extra = curr.filter((p) => !saved.includes(p.id))
          return [...ordered, ...extra]
        })
      }
    }
  }, [projectsLoading, setProjects])

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

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setProjects((items) => {
      const oldIndex = items.findIndex((p) => p.id === active.id)
      const newIndex = items.findIndex((p) => p.id === over.id)
      const reordered = arrayMove(items, oldIndex, newIndex)
      saveProjectOrder(reordered.map((p) => p.id))
      return reordered
    })
  }

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

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    setDeletingProjectId(id)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
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

  return (
    <div className="space-y-16">
      {/* ── Projects ── */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-[-0.02em] text-white">Projects</h2>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-white/40">
              {projectsLoading ? 'Loading…' : `${projects.length} total`}
            </p>
          </div>
          <Link
            to="/admin/projects/new"
            className="border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:border-white/40 hover:bg-white/5"
          >
            + New project
          </Link>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
          <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <SortableProjectCard
                  key={p.id}
                  p={p}
                  deletingId={deletingProjectId}
                  togglingId={togglingProjectId}
                  onDelete={handleDeleteProject}
                  onToggle={handleToggleHidden}
                />
              ))}
              {!projectsLoading && projects.length === 0 ? (
                <p className="col-span-full text-sm text-white/50">No projects yet.</p>
              ) : null}
            </div>
          </SortableContext>
        </DndContext>
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
