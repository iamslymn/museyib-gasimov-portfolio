import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { MainLayout } from '@/layouts/MainLayout'
import { Archive } from '@/pages/Archive'
import { CategoryPage } from '@/pages/CategoryPage'
import { Contact } from '@/pages/Contact'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { ProjectDetail } from '@/pages/ProjectDetail'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/music-videos" element={<CategoryPage category="music-videos" />} />
          <Route path="/ai-works" element={<CategoryPage category="ai-works" />} />
          <Route path="/commercials" element={<CategoryPage category="commercials" />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
