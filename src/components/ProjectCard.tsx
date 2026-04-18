import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import type { Project } from '@/types'

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.article
      className="group relative"
      initial={false}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/project/${project.slug}`}
        className="block overflow-hidden focus-visible:outline-offset-4"
        aria-label={`Open project: ${project.title}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-elevated)]">
          <img
            src={project.thumbnail}
            alt=""
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 ease-out group-hover:bg-black/60"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="translate-y-2 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 text-center">
              <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
                {project.title}
              </h2>
              {project.year ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/70">
                  {project.year}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
