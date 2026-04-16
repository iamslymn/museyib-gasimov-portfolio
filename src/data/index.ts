export { archiveImages } from './archive'
export { contactInfo } from './contact'
export { projects } from './projects'

import type { ProjectCategory } from '@/types'

import { projects } from './projects'

/** Future: `const { data } = await supabase.from('projects').select()` */
export function getAllProjects() {
  return [...projects].sort((a, b) => (b.year ?? '').localeCompare(a.year ?? ''))
}

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug)
}

export function getProjectsByCategory(category: ProjectCategory) {
  return getAllProjects().filter((p) => p.category === category)
}
