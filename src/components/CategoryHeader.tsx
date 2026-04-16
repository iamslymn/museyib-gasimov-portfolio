type CategoryHeaderProps = {
  title: string
  subtitle?: string
}

export function CategoryHeader({ title, subtitle }: CategoryHeaderProps) {
  return (
    <div className="mb-12 max-w-2xl sm:mb-16 lg:mb-20">
      <h1 className="font-display text-3xl font-normal tracking-[-0.02em] text-white sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-foreground-muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
