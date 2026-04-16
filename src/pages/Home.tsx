import { CategoryHeader } from '@/components/CategoryHeader'
import { ProjectGrid } from '@/components/ProjectGrid'
import { useProjects } from '@/hooks/useProjects'

export function Home() {
  const projects = useProjects()

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-8 sm:px-8 sm:pb-32 lg:px-12 lg:pt-12">
      <CategoryHeader
        title="Selected work"
        subtitle="A quiet edit of recent films — performance, image-led stories, and commissioned pieces."
      />
      <ProjectGrid projects={projects} />
    </div>
  )
}
