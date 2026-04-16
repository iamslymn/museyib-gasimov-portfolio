import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
}

type PageTransitionProps = {
  children: ReactNode
  routeKey: string
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}
