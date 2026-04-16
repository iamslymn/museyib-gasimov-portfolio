import type { ArchiveImage } from '@/types'

type MasonryGridProps = {
  images: ArchiveImage[]
}

export function MasonryGrid({ images }: MasonryGridProps) {
  return (
    <div
      className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 lg:gap-6"
      role="list"
    >
      {images.map((item, index) => {
        const ratio =
          index % 3 === 0 ? 'aspect-[4/3]' : index % 3 === 1 ? 'aspect-[16/10]' : 'aspect-[3/4]'
        return (
          <div
            key={item.id}
            className={`mb-4 overflow-hidden break-inside-avoid bg-[var(--color-surface-elevated)] sm:mb-5 lg:mb-6 ${ratio}`}
            role="listitem"
          >
            <img
              src={item.imageUrl}
              alt={item.alt}
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        )
      })}
    </div>
  )
}
