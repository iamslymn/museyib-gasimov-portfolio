import { STORAGE_BUCKETS, supabase } from './supabase'

type Bucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

/**
 * Upload a file and return a public URL.
 *
 * - When Supabase is configured we push to the target bucket.
 * - Otherwise we fall back to `URL.createObjectURL` so admin flows remain
 *   usable during local development / before the backend is wired.
 */
export async function uploadImage(bucket: Bucket, file: File): Promise<string> {
  if (!supabase) {
    return URL.createObjectURL(file)
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadImages(bucket: Bucket, files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => uploadImage(bucket, f)))
}
