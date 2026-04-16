import { MasonryGrid } from '@/components/MasonryGrid'
import { archiveImages } from '@/data'

export function Archive() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-8 sm:px-8 sm:pb-32 lg:px-12 lg:pt-12">
      <div className="mb-10 sm:mb-14">
        <h1 className="font-display text-3xl font-normal tracking-[-0.02em] text-white sm:text-4xl">
          Archive
        </h1>
      </div>
      <MasonryGrid images={archiveImages} />
    </div>
  )
}
