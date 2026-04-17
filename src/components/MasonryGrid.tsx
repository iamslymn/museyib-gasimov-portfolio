import { useState } from 'react'

import type { ArchiveItem } from '@/types'

import { Lightbox } from './Lightbox'

type MasonryGridProps = {
  images: ArchiveItem[]
}

export function MasonryGrid({ images }: MasonryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const slides = images.map((item, i) => ({
    src: item.imageUrl,
    alt: item.title ?? `Archive image ${i + 1}`,
  }))

  return (
    <>
      <div
        className="columns-1 gap-2 sm:columns-2 sm:gap-2.5 lg:columns-3 lg:gap-3"
        role="list"
      >
        {images.map((item, index) => {
          const ratio =
            index % 3 === 0 ? 'aspect-[4/3]' : index % 3 === 1 ? 'aspect-[16/10]' : 'aspect-[3/4]'
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group mb-2 block w-full cursor-zoom-in overflow-hidden break-inside-avoid bg-[var(--color-surface-elevated)] focus-visible:outline-offset-2 sm:mb-2.5 lg:mb-3 ${ratio}`}
              role="listitem"
              aria-label={`Open image ${index + 1} of ${images.length}`}
            >
              <img
                src={item.imageUrl}
                alt={item.title ?? ''}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            </button>
          )
        })}
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
