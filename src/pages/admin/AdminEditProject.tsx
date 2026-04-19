import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { listAllProjectsForAdmin, updateProject } from '@/services'
import type { EmbedType, Project, ProjectCategory } from '@/types'
import { slugify } from '@/utils/slug'

import {
  CategoryCheckboxes,
  GalleryEditor,
  type GalleryItem,
  embedOptions,
  fileInputClass,
  inputClass,
  labelClass,
} from './AdminNewProject'

export function AdminEditProject() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!id) { setNotFound(true); return }

    setLoadError(null)
    listAllProjectsForAdmin().then((all) => {
      const found = all.find((p) => p.id === id) ?? null
      if (!found) { setNotFound(true); return }

      setProject(found)
      setTitle(found.title)
      setSlug(found.slug)
      setCategories(found.categories.length ? found.categories : ['music-videos'])
      setEmbedType(found.embedType)
      setEmbedUrl(found.embedUrl)
      setYear(found.year ?? '')
      setDescription(found.description ?? '')
      setIsHidden(found.isHidden)
      setIsFeatured(found.isFeatured)
      setGalleryItems(
        found.galleryMedia.map((entry) =>
          entry.type === 'image'
            ? { kind: 'existing' as const, url: entry.url }
            : {
                kind: 'video' as const,
                id: crypto.randomUUID(),
                embedType: entry.embedType,
                embedUrl: entry.embedUrl,
              },
        ),
      )
    }).catch(() => {
      setLoadError('Could not load projects. Check the browser Network tab for the Supabase error.')
    })
  }, [id])

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
    if (!project) return
    setError(null)
    if (categories.length === 0) { setError('Select at least one category.'); return }
    const finalSlug = computedSlug.trim()
    if (!finalSlug) { setError('Slug is required.'); return }

    setSubmitting(true)
    try {
      await updateProject({
        id: project.id,
        title: title.trim(),
        slug: finalSlug,
        categories,
        embedType,
        embedUrl: embedUrl.trim(),
        thumbnailFile: thumbnail,
        thumbnailExistingUrl: project.thumbnail,
        galleryItems,
        description: description.trim() || undefined,
        year: year.trim() || undefined,
        isHidden,
        isFeatured,
      })
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project.')
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-white/50">Project not found.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-400/90" role="alert">{loadError}</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl tracking-[-0.02em] text-white">Edit project</h2>
      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40">{project.title}</p>

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
          {!thumbnail && project.thumbnail ? (
            <div className="mb-2 mt-2 aspect-[16/10] w-full max-w-xs overflow-hidden bg-black">
              <img src={project.thumbnail} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          {thumbnailPreview ? (
            <div className="mb-2 aspect-[16/10] w-full max-w-xs overflow-hidden bg-black">
              <img src={thumbnailPreview} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} className={fileInputClass} />
          <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">Leave blank to keep the current thumbnail.</span>
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
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => navigate('/admin')} className="text-[11px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
