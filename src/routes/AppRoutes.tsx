import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { MainLayout } from '@/layouts/MainLayout'
import { Archive } from '@/pages/Archive'
import { CategoryPage } from '@/pages/CategoryPage'
import { Contact } from '@/pages/Contact'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminEditProject } from '@/pages/admin/AdminEditProject'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminLogin } from '@/pages/admin/AdminLogin'
import { AdminNewArchive } from '@/pages/admin/AdminNewArchive'
import { AdminNewProject } from '@/pages/admin/AdminNewProject'

import { AdminProtectedRoute } from './AdminProtectedRoute'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/music-videos" element={<CategoryPage category="music-videos" />} />
          <Route path="/ai-works" element={<CategoryPage category="ai-works" />} />
          <Route path="/commercials" element={<CategoryPage category="commercials" />} />
          <Route path="/experiments" element={<CategoryPage category="experiments" />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/404" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="projects/new" element={<AdminNewProject />} />
          <Route path="projects/:id/edit" element={<AdminEditProject />} />
          <Route path="archive/new" element={<AdminNewArchive />} />
        </Route>

        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
