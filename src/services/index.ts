export { createArchiveItem, deleteArchiveItem, listArchiveItems } from './archive'
export { signIn, signOut, getCurrentAdmin, DEMO_CREDENTIALS } from './auth'
export {
  createProject,
  deleteProject,
  getProjectBySlug,
  listAllProjectsForAdmin,
  listProjects,
  listProjectsByCategory,
  toggleProjectVisibility,
  updateProject,
} from './projects'
export { uploadImage, uploadImages } from './storage'
export { STORAGE_BUCKETS, isSupabaseConfigured, supabase } from './supabase'
