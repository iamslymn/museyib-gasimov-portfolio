import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/music-videos', label: 'Music Videos' },
  { to: '/ai-works', label: 'AI Works' },
  { to: '/commercials', label: 'Commercials' },
  { to: '/archive', label: 'Archive' },
  { to: '/contact', label: 'Contact' },
] as const

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-[11px] uppercase tracking-[0.22em] transition-colors duration-300',
    isActive ? 'text-white' : 'text-[var(--color-foreground-muted)] hover:text-white/90',
  ].join(' ')

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-12">
        <NavLink to="/" className="group flex shrink-0 flex-col gap-0.5">
          <motion.span
            className="font-display text-[13px] font-medium uppercase tracking-[0.28em] text-white"
            whileHover={{ opacity: 0.85 }}
            transition={{ duration: 0.2 }}
          >
            Museyib Gasimov
          </motion.span>
          <span className="text-[10px] font-[350] uppercase tracking-[0.2em] text-[var(--color-foreground-muted)]">
            Director · DP
          </span>
        </NavLink>

        <nav
          className="hidden flex-wrap items-center justify-end gap-x-8 gap-y-3 md:flex"
          aria-label="Primary"
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <MobileNav />
      </div>
    </header>
  )
}

function MobileNav() {
  return (
    <nav
      className="-mr-2 flex max-w-[min(72vw,20rem)] items-center gap-1 overflow-x-auto pb-1 md:hidden"
      aria-label="Primary mobile"
    >
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={(state) =>
            `${linkClass(state)} shrink-0 whitespace-nowrap px-2 py-1`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
