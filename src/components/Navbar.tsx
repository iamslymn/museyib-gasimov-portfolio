import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/music-videos', label: 'Music Videos' },
  { to: '/ai-works', label: 'AI Works' },
  { to: '/commercials', label: 'Commercials' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/archive', label: 'Archive' },
  { to: '/contact', label: 'Contact' },
] as const

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-[11px] uppercase tracking-[0.22em] transition-colors duration-300',
    isActive ? 'text-white' : 'text-[var(--color-foreground-muted)] hover:text-white/90',
  ].join(' ')

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLinkClick = () => setMenuOpen(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface)]/85 backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-8 pl-4 pr-5 py-5 sm:pl-6 sm:pr-8 lg:pl-10 lg:pr-12">
          <NavLink to="/" onClick={handleLinkClick} className="shrink-0">
            <motion.span
              className="font-display text-[16px] font-medium uppercase tracking-[0.22em] text-white"
              whileHover={{ opacity: 0.85 }}
              transition={{ duration: 0.2 }}
            >
              Museyib Gasimov
            </motion.span>
          </NavLink>

          {/* Desktop nav */}
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

          {/* Mobile burger button */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="relative flex h-9 w-9 items-center justify-center md:hidden"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute block h-px w-5 bg-white origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute block h-px w-5 bg-white origin-center"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute block h-px w-5 bg-white origin-center"
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-[var(--color-surface)] pt-[72px] md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              className="flex flex-col gap-1 px-5 py-8"
              aria-label="Primary mobile"
              onClick={(e) => e.stopPropagation()}
            >
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.08 + i * 0.04 }}
                >
                  <NavLink
                    to={l.to}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `block py-3 text-[13px] uppercase tracking-[0.24em] transition-colors ${
                        isActive ? 'text-white' : 'text-white/50 hover:text-white/90'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                  <div className="h-px bg-white/[0.06]" />
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

