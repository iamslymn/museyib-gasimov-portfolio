import { CategoryHeader } from '@/components/CategoryHeader'
import { ProjectGrid } from '@/components/ProjectGrid'
import { useProjects } from '@/hooks/useProjects'
import type { ProjectCategory } from '@/types'

const copy: Record<
  ProjectCategory,
  { title: string; subtitle: string }
> = {
  'music-videos': {
    title: 'Music videos',
    subtitle:
      'Performance-led pieces where rhythm, light, and negative space do most of the talking.',
  },
  'ai-works': {
    title: 'AI works',
    subtitle:
      'Hybrid image-making — generative layers, careful compositing, and human framing.',
  },
  commercials: {
    title: 'Commercials',
    subtitle:
      'Brand films and launches with a cinematic lens and restrained art direction.',
  },
}

type CategoryPageProps = {
  category: ProjectCategory
}

export function CategoryPage({ category }: CategoryPageProps) {
  const projects = useProjects(category)
  const { title, subtitle } = copy[category]

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-8 sm:px-8 sm:pb-32 lg:px-12 lg:pt-12">
      <CategoryHeader title={title} subtitle={subtitle} />
      <ProjectGrid projects={projects} />
    </div>
  )
}
