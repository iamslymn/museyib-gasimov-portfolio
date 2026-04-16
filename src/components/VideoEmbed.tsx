import { toEmbedSrc } from '@/utils/video'

type VideoEmbedProps = {
  embedType: 'youtube' | 'vimeo'
  embedUrl: string
  title: string
}

export function VideoEmbed({ embedType, embedUrl, title }: VideoEmbedProps) {
  const src = toEmbedSrc(embedType, embedUrl)

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  )
}
