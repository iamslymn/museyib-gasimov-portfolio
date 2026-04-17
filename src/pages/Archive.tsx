import { MasonryGrid } from '@/components/MasonryGrid'
import { useArchive } from '@/hooks/useArchive'

export function Archive() {
  const { items } = useArchive()

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-8 sm:px-8 sm:pb-32 lg:px-12 lg:pt-12">
      <MasonryGrid images={items} />
    </div>
  )
}
