import { toEmbedSrc } from '@/utils/video'

type VideoEmbedProps = {
  embedType: 'youtube' | 'vimeo'
  embedUrl: string
  title: string
}

export function VideoEmbed({ embedType, embedUrl, title }: VideoEmbedProps) {
  const src = toEmbedSrc(embedType, embedUrl)

  return (
    <div className="w-full bg-black">
      <div className="mx-auto w-full max-w-[min(100%,44rem)] px-4 pt-6 sm:px-6 sm:pt-8 lg:pt-10">
        <div className="relative mx-auto w-full overflow-hidden rounded-sm border border-white/[0.06] bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
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
      </div>
    </div>
  )
}
