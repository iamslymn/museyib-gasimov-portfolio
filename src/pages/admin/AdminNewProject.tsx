import {
  DndContext,
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
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { createProject } from '@/services'
import type { EmbedType, ProjectCategory, ProjectGalleryEditorItem } from '@/types'
import { PROJECT_CATEGORY_LABEL } from '@/types'
import { slugify } from '@/utils/slug'

// ── Shared style constants ────────────────────────────────────────────────────
export const labelClass = 'block text-[11px] uppercase tracking-[0.22em] text-white/60'
export const inputClass =
  'mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/40'
export const fileInputClass =
  'mt-2 block w-full text-xs text-white/60 file:mr-4 file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-1.5 file:text-[11px] file:uppercase file:tracking-[0.22em] file:text-white/80 hover:file:border-white/30'

export const categoryOptions: ProjectCategory[] = ['music-videos', 'ai-works', 'commercials', 'experiments']
export const embedOptions: EmbedType[] = ['youtube', 'vimeo']

// ── Category checkbox group ───────────────────────────────────────────────────
type CategoryCheckboxesProps = {
  selected: ProjectCategory[]
  onChange: (cats: ProjectCategory[]) => void
}

export function CategoryCheckboxes({ selected, onChange }: CategoryCheckboxesProps) {
  const toggle = (cat: ProjectCategory) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  return (
    <div>
      <span className={labelClass}>Categories</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {categoryOptions.map((cat) => {
          const active = selected.includes(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] transition-colors ${
                active
                  ? 'border border-white/50 bg-white/10 text-white'
                  : 'border border-white/15 bg-transparent text-white/40 hover:border-white/30 hover:text-white/70'
              }`}
            >
              {PROJECT_CATEGORY_LABEL[cat]}
            </button>
          )
        })}
      </div>
      {selected.length === 0 ? (
        <p className="mt-1.5 text-[10px] text-red-400/70">Select at least one category.</p>
      ) : null}
    </div>
  )
}

// ── Gallery editor ────────────────────────────────────────────────────────────
export type GalleryItem = ProjectGalleryEditorItem

function getGalleryItemId(item: GalleryItem) {
  if (item.kind === 'existing') return item.url
  if (item.kind === 'new') return item.preview
  return item.id
}

type SortableGalleryItemProps = {
  item: GalleryItem
  index: number
  items: GalleryItem[]
  onRemove: (index: number) => void
  onChange: (items: GalleryItem[]) => void
}

function SortableGalleryItem({ item, index, items, onRemove, onChange }: SortableGalleryItemProps) {
  const itemId = getGalleryItemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  })

  if (item.kind === 'video') {
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
        className="col-span-3 sm:col-span-4"
      >
        <div
          {...listeners}
          className="cursor-grab touch-none border border-white/10 bg-black/40 p-3 active:cursor-grabbing sm:flex sm:flex-wrap sm:items-end sm:gap-3"
        >
          <label className="block min-w-[7rem] shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/50">
            Video
            <select
              value={item.embedType}
              onChange={(e) => {
                const next = [...items]
                next[index] = { ...item, embedType: e.target.value as EmbedType }
                onChange(next)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`${inputClass} mt-1.5 cursor-pointer text-xs`}
            >
              {embedOptions.map((e) => (
                <option key={e} value={e} className="bg-black">
                  {e === 'youtube' ? 'YouTube' : 'Vimeo'}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block min-w-0 flex-1 text-[10px] uppercase tracking-[0.2em] text-white/50 sm:mt-0">
            Link
            <input
              value={item.embedUrl}
              onChange={(e) => {
                const next = [...items]
                next[index] = { ...item, embedUrl: e.target.value }
                onChange(next)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`${inputClass} mt-1.5 font-mono text-[11px]`}
              placeholder="https://…"
            />
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label="Remove video"
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-3 shrink-0 self-end border border-white/15 px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:border-white/30 hover:text-white/80 sm:mt-0"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

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
      className="group relative aspect-[4/3] cursor-grab touch-none overflow-hidden bg-black active:cursor-grabbing"
    >
      <img
        src={itemId}
        alt=""
        className="pointer-events-none h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label="Remove image"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-black/70 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}

type GalleryEditorProps = {
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
}

export function GalleryEditor({ items, onChange }: GalleryEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleAdd = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (!files.length) return
    const newItems: GalleryItem[] = files.map((file) => ({
      kind: 'new',
      file,
      preview: URL.createObjectURL(file),
    }))
    onChange([...items, ...newItems])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = useCallback(
    (index: number) => {
      const item = items[index]
      if (item.kind === 'new') URL.revokeObjectURL(item.preview)
      onChange(items.filter((_, i) => i !== index))
    },
    [items, onChange],
  )

  const handleAddVideo = () => {
    onChange([
      ...items,
      {
        kind: 'video',
        id: crypto.randomUUID(),
        embedType: 'youtube' as EmbedType,
        embedUrl: '',
      },
    ])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => getGalleryItemId(item) === active.id)
    const newIndex = items.findIndex((item) => getGalleryItemId(item) === over.id)
    onChange(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className={labelClass}>Gallery</span>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAddVideo}
            className="text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white/80"
          >
            + Add video
          </button>
          <label className="cursor-pointer text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white/80">
            + Add images
            <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleAdd} />
          </label>
        </div>
      </div>
      <p className="mb-3 text-[10px] normal-case tracking-normal text-white/30">
        Stills and extra embeds appear in one grid on the project page (hero video is separate).
      </p>

      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(getGalleryItemId)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {items.map((item, i) => (
                <SortableGalleryItem
                  key={getGalleryItemId(item)}
                  item={item}
                  index={i}
                  items={items}
                  onRemove={handleRemove}
                  onChange={onChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-[11px] text-white/30">No gallery items yet.</p>
      )}
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────
export function AdminNewProject() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  const [categories, setCategories] = useState<ProjectCategory[]>(['music-videos'])
  const [embedType, setEmbedType] = useState<EmbedType>('youtube')
  const [embedUrl, setEmbedUrl] = useState('')
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')
  const [isHidden, setIsHidden] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computedSlug = useMemo(
    () => (slugDirty ? slug : slugify(title)),
    [slug, slugDirty, title],
  )

  const thumbnailPreview = useMemo(
    () => (thumbnail ? URL.createObjectURL(thumbnail) : null),
    [thumbnail],
  )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (categories.length === 0) { setError('Select at least one category.'); return }
    const finalSlug = computedSlug.trim()
    if (!finalSlug) { setError('Slug is required.'); return }

    setSubmitting(true)
    try {
      await createProject({
        title: title.trim(),
        slug: finalSlug,
        categories,
        embedType,
        embedUrl: embedUrl.trim(),
        thumbnailFile: thumbnail,
        galleryItems,
        description: description.trim() || undefined,
        year: year.trim() || undefined,
        isHidden,
        isFeatured,
      })
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl tracking-[-0.02em] text-white">New project</h2>
      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40">
        Add a film to your public portfolio
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <label className={labelClass}>
          Title
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>

        <label className={labelClass}>
          Slug
          <input
            required
            value={computedSlug}
            onChange={(e) => { setSlug(e.target.value); setSlugDirty(true) }}
            className={inputClass}
            placeholder="auto-generated-from-title"
          />
          <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
            URL: /project/{computedSlug || 'your-slug'}
          </span>
        </label>

        <CategoryCheckboxes selected={categories} onChange={setCategories} />

        <label className={labelClass}>
          Year
          <input value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} placeholder="2025" />
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[140px_1fr]">
          <label className={labelClass}>
            Embed
            <select value={embedType} onChange={(e) => setEmbedType(e.target.value as EmbedType)} className={inputClass}>
              {embedOptions.map((e) => (
                <option key={e} value={e} className="bg-black">{e === 'youtube' ? 'YouTube' : 'Vimeo'}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Embed link
            <input required value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} className={inputClass} placeholder="https://..." />
          </label>
        </div>

        <label className={labelClass}>
          Description <span className="normal-case tracking-normal text-white/30">(optional)</span>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-y`} />
        </label>

        <div>
          <span className={labelClass}>Thumbnail</span>
          <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} className={fileInputClass} />
          {thumbnailPreview ? (
            <div className="mt-3 aspect-[16/10] w-full max-w-xs overflow-hidden bg-black">
              <img src={thumbnailPreview} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>

        <GalleryEditor items={galleryItems} onChange={setGalleryItems} />

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 accent-white" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              Featured on homepage
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} className="h-4 w-4 accent-white" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/60">Hide from public site</span>
          </label>
        </div>

        {error ? <p className="text-xs text-red-400/90" role="alert">{error}</p> : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="border border-white/20 bg-white/5 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Create project'}
          </button>
          <button type="button" onClick={() => navigate('/admin')} className="text-[11px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
