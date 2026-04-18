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

function applyOrder(items: ArchiveItem[], order: string[] | null): ArchiveItem[] {
  if (!order || order.length === 0) return items
  const map = new Map(items.map((i) => [i.id, i]))
  const ordered = order.map((id) => map.get(id)).filter((i): i is ArchiveItem => !!i)
  const rest = items.filter((i) => !order.includes(i.id))
  return [...ordered, ...rest]
}

export async function listArchiveItems(): Promise<ArchiveItem[]> {
  const saved = loadArchiveOrder()

  if (!supabase) return applyOrder([...mockStore], saved)

  const { data, error } = await supabase
    .from('archive_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return applyOrder((data as DbArchiveItem[]).map(mapRow), saved)
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

const ARCHIVE_ORDER_KEY = 'admin_archive_order'

export function saveArchiveOrder(ids: string[]): void {
  localStorage.setItem(ARCHIVE_ORDER_KEY, JSON.stringify(ids))
}

export function loadArchiveOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(ARCHIVE_ORDER_KEY)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
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
