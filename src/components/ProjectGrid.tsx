import type { Project } from '@/types'

import { ProjectCard } from './ProjectCard'

type ProjectGridProps = {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:gap-x-14 lg:gap-y-16">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  )
}
