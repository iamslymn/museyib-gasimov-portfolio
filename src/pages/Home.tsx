import { ProjectGrid } from '@/components/ProjectGrid'
import { useProjects } from '@/hooks/useProjects'

export function Home() {
  const { projects } = useProjects({ featured: true })

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-8 sm:px-8 sm:pb-32 lg:px-12 lg:pt-12">
      <ProjectGrid projects={projects} />
    </div>
  )
}
