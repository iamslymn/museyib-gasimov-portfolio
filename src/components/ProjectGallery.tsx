import { useState } from 'react'

import { Lightbox } from './Lightbox'

type ProjectGalleryProps = {
  images: string[]
  projectTitle: string
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const slides = images.map((src, i) => ({
    src,
    alt: `${projectTitle} — frame ${i + 1}`,
  }))

  return (
    <>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
        {images.map((src, i) => (
          <figure
            key={src}
            className="overflow-hidden bg-[var(--color-surface-elevated)]"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group block h-full w-full cursor-zoom-in focus-visible:outline-offset-2"
              aria-label={`Open image ${i + 1} of ${images.length}`}
            >
              <img
                src={src}
                alt={`${projectTitle} — frame ${i + 1}`}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            </button>
          </figure>
        ))}
      </div>

      <Lightbox
        slides={slides}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onChange={setActiveIndex}
      />
    </>
  )
}
