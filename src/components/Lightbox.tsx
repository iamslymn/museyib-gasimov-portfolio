import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect } from 'react'

export type LightboxSlide = {
  src: string
  alt?: string
}

type LightboxProps = {
  slides: LightboxSlide[]
  index: number | null
  onClose: () => void
  onChange?: (nextIndex: number) => void
}

const overlayTransition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }

export function Lightbox({ slides, index, onClose, onChange }: LightboxProps) {
  const isOpen = index !== null
  const current = isOpen ? slides[index] : null
  const total = slides.length
  const canNavigate = total > 1 && onChange !== undefined

  const goPrev = useCallback(() => {
    if (!canNavigate || index === null) return
    onChange!((index - 1 + total) % total)
  }, [canNavigate, index, onChange, total])

  const goNext = useCallback(() => {
    if (!canNavigate || index === null) return
    onChange!((index + 1) % total)
  }, [canNavigate, index, onChange, total])

  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      } else if (e.key === 'ArrowRight') {
        goNext()
      }
    }

    window.addEventListener('keydown', handleKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = overflow
    }
  }, [isOpen, onClose, goPrev, goNext])

  return (
    <AnimatePresence>
      {isOpen && current ? (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close image viewer"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 transition-colors hover:border-white/30 hover:text-white sm:right-8 sm:top-8"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>

          {canNavigate ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 transition-colors hover:border-white/30 hover:text-white sm:left-6"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M10 2L4 8l6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 transition-colors hover:border-white/30 hover:text-white sm:right-6"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 2l6 6-6 6" />
                </svg>
              </button>
            </>
          ) : null}

          <motion.figure
            key={current.src}
            className="relative max-h-[90vh] max-w-[92vw] px-2"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              alt={current.alt ?? ''}
              className="max-h-[90vh] max-w-[92vw] object-contain"
              draggable={false}
            />
            {canNavigate ? (
              <figcaption className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.24em] text-white/50">
                {(index ?? 0) + 1} / {total}
              </figcaption>
            ) : null}
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
