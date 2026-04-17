import { archiveSeed } from '@/data'
import type { ArchiveItem, NewArchiveItemInput } from '@/types'

import { uploadImage } from './storage'
import { STORAGE_BUCKETS, supabase } from './supabase'

const mockStore: ArchiveItem[] = [...archiveSeed]

type DbArchiveItem = {
  id: string
  image_url: string
  title: string | null
  created_at: string
}

function mapRow(row: DbArchiveItem): ArchiveItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    createdAt: row.created_at,
  }
}

export async function listArchiveItems(): Promise<ArchiveItem[]> {
  if (!supabase) return [...mockStore]

  const { data, error } = await supabase
    .from('archive_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as DbArchiveItem[]).map(mapRow)
}

export async function createArchiveItem(input: NewArchiveItemInput): Promise<ArchiveItem> {
  const imageUrl = await uploadImage(STORAGE_BUCKETS.archive, input.imageFile)

  if (!supabase) {
    const item: ArchiveItem = {
      id: `arch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      imageUrl,
      title: input.title?.trim() || null,
      createdAt: new Date().toISOString(),
    }
    mockStore.unshift(item)
    return item
  }

  const { data, error } = await supabase
    .from('archive_items')
    .insert({ image_url: imageUrl, title: input.title?.trim() || null })
    .select()
    .single()

  if (error) throw error
  return mapRow(data as DbArchiveItem)
}

export async function deleteArchiveItem(id: string): Promise<void> {
  if (!supabase) {
    const idx = mockStore.findIndex((i) => i.id === id)
    if (idx !== -1) mockStore.splice(idx, 1)
    return
  }

  const { error } = await supabase.from('archive_items').delete().eq('id', id)
  if (error) throw error
}
