export { createArchiveItem, deleteArchiveItem, listArchiveItems, saveArchiveOrder, loadArchiveOrder } from './archive'
export { signIn, signOut, getCurrentAdmin, DEMO_CREDENTIALS } from './auth'
export {
  createProject,
  deleteProject,
  getProjectBySlug,
  listAllProjectsForAdmin,
  listFeaturedProjects,
  listProjects,
  listProjectsByCategory,
  loadCategoryProjectOrder,
  loadFeaturedOrder,
  loadProjectOrder,
  reorderFeatured,
  reorderProjects,
  saveCategoryProjectOrder,
  saveFeaturedOrder,
  saveProjectOrder,
  toggleProjectFeatured,
  toggleProjectVisibility,
  updateProject,
} from './projects'
export { uploadImage, uploadImages } from './storage'
export { STORAGE_BUCKETS, isSupabaseConfigured, supabase } from './supabase'
