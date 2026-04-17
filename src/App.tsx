import { AdminAuthProvider } from '@/context/AdminAuthContext'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <AdminAuthProvider>
      <AppRoutes />
    </AdminAuthProvider>
  )
}

export default App
