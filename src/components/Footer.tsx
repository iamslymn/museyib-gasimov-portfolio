import { useLocation } from 'react-router-dom'

export function Footer() {
  const { pathname } = useLocation()
  const isContact = pathname === '/contact'

  return (
    <footer
      className={`border-t border-white/[0.06] py-10 ${isContact ? 'bg-black' : ''}`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-foreground-muted)]">
          © {new Date().getFullYear()} Museyib Gasimov
        </p>
        <p className="text-[11px] tracking-wide text-[var(--color-foreground-muted)]">
          Cinematography &amp; direction
        </p>
      </div>
    </footer>
  )
}
