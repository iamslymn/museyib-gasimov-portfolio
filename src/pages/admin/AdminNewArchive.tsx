import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { createArchiveItem } from '@/services'

const labelClass = 'block text-[11px] uppercase tracking-[0.22em] text-white/60'
const inputClass =
  'mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/40'

export function AdminNewArchive() {
  const navigate = useNavigate()

  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    setFiles(list ? Array.from(list) : [])
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!files.length) {
      setError('Select at least one image.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      for (const file of files) {
        await createArchiveItem({ imageFile: file, title: title.trim() || undefined })
      }
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-2xl tracking-[-0.02em] text-white">Upload archive images</h2>
      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40">
        Bulk-add stills to the archive grid
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <span className={labelClass}>Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="mt-2 block w-full text-xs text-white/60 file:mr-4 file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-1.5 file:text-[11px] file:uppercase file:tracking-[0.22em] file:text-white/80 hover:file:border-white/30"
          />
          {previews.length ? (
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {previews.map((p) => (
                <div key={p.url} className="aspect-square overflow-hidden bg-black">
                  <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <label className={labelClass}>
          Title / alt text{' '}
          <span className="normal-case tracking-normal text-white/30">(optional, applied to all)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </label>

        {error ? (
          <p className="text-xs text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="border border-white/20 bg-white/5 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
          >
            {submitting ? 'Uploading…' : `Upload${files.length ? ` (${files.length})` : ''}`}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="text-[11px] uppercase tracking-[0.22em] text-white/40 hover:text-white/70"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
