import { AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PageTransition } from '@/components/PageTransition'

export function MainLayout() {
  const location = useLocation()
  const isContact = location.pathname === '/contact'

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-xs focus:text-black"
      >
        Skip to content
      </a>
      <Navbar />
      <main
        id="main-content"
        className={`flex flex-1 flex-col pt-[100px] md:pt-[108px] ${isContact ? 'bg-black' : ''}`}
      >
        <AnimatePresence mode="wait">
          <PageTransition routeKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
