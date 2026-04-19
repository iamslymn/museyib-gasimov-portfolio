import { useMemo, useState } from 'react'

import type { GalleryMediaItem } from '@/types'
import { toEmbedSrc } from '@/utils/video'

import { Lightbox } from './Lightbox'

type ProjectGalleryProps = {
  items: GalleryMediaItem[]
  projectTitle: string
}

export function ProjectGallery({ items, projectTitle }: ProjectGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

  const imageSlides = useMemo(
    () =>
      items
        .filter((m): m is Extract<GalleryMediaItem, { type: 'image' }> => m.type === 'image')
        .map((m, i) => ({
          src: m.url,
          alt: `${projectTitle} — frame ${i + 1}`,
        })),
    [items, projectTitle],
  )

  const lightboxIndexByItemIndex = useMemo(() => {
    let n = 0
    return items.map((it) => (it.type === 'image' ? n++ : null))
  }, [items])

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-3">
        {items.map((item, i) => {
          if (item.type === 'image') {
            const lightboxIndex = lightboxIndexByItemIndex[i]!
            const src = item.url
            return (
              <figure
                key={`${src}-${i}`}
                className="overflow-hidden bg-[var(--color-surface-elevated)]"
              >
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(lightboxIndex)}
                  className="group block h-full w-full cursor-zoom-in focus-visible:outline-offset-2"
                  aria-label={`Open image ${lightboxIndex + 1} of ${imageSlides.length}`}
                >
                  <img
                    src={src}
                    alt={`${projectTitle} — frame ${lightboxIndex + 1}`}
                    width={1200}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                </button>
              </figure>
            )
          }

          const src = toEmbedSrc(item.embedType, item.embedUrl)
          return (
            <figure
              key={`video-${i}-${item.embedUrl}`}
              className="overflow-hidden bg-black lg:col-span-1"
            >
              <div className="aspect-[3/2] w-full overflow-hidden border border-white/[0.06] bg-black">
                <iframe
                  className="h-full w-full scale-[1.01]"
                  src={src}
                  title={`${projectTitle} — video ${i + 1}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </figure>
          )
        })}
      </div>

      <Lightbox
        slides={imageSlides}
        index={activeImageIndex}
        onClose={() => setActiveImageIndex(null)}
        onChange={setActiveImageIndex}
      />
    </>
  )
}
