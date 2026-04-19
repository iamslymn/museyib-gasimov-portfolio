import { Link, useParams } from 'react-router-dom'

import { ProjectGallery } from '@/components/ProjectGallery'
import { VideoEmbed } from '@/components/VideoEmbed'
import { useProject } from '@/hooks/useProject'
import { PROJECT_CATEGORY_LABEL } from '@/types'

export function ProjectDetail() {
  const { slug } = useParams()
  const { project, loading } = useProject(slug)

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] px-5 py-24 text-center sm:px-8">
        <p className="text-sm text-[var(--color-foreground-muted)]">Loading…</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-[960px] px-5 py-24 text-center sm:px-8">
        <p className="text-sm text-[var(--color-foreground-muted)]">Project not found.</p>
        <Link
          to="/"
          className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] text-white/90 hover:text-white"
        >
          Back to work
        </Link>
      </div>
    )
  }

  return (
    <article className="pb-24">
      <VideoEmbed
        embedType={project.embedType}
        embedUrl={project.embedUrl}
        title={project.title}
      />

      <div className="mx-auto max-w-[1400px] px-5 pt-12 sm:px-8 lg:px-12 lg:pt-16">
        <header className="mb-8 max-w-2xl lg:mb-12">
          <h1 className="font-display text-3xl font-normal tracking-[-0.03em] text-white sm:text-4xl lg:text-[2.5rem]">
            {project.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-[var(--color-foreground-muted)]">
            {project.year ? <span>{project.year}</span> : null}
            {project.categories.map((cat) => (
              <span key={cat} className="text-white/50">
                {PROJECT_CATEGORY_LABEL[cat] ?? cat}
              </span>
            ))}
          </div>
          {project.description ? (
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-foreground-muted)]">
              {project.description}
            </p>
          ) : null}
        </header>

        <ProjectGallery items={project.galleryMedia} projectTitle={project.title} />
      </div>
    </article>
  )
}
