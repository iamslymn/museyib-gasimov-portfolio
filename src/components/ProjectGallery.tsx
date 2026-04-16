type ProjectGalleryProps = {
  images: string[]
  projectTitle: string
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {images.map((src, i) => (
        <figure
          key={src}
          className="overflow-hidden bg-[var(--color-surface-elevated)]"
        >
          <img
            src={src}
            alt={`${projectTitle} — frame ${i + 1}`}
            width={1200}
            height={800}
            loading="lazy"
            decoding="async"
            className="aspect-[3/2] w-full object-cover"
          />
        </figure>
      ))}
    </div>
  )
}
