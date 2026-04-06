import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { FullPageLoader } from './components/ui/Loader'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Feed = lazy(() => import('./pages/Feed'))
const Library = lazy(() => import('./pages/Library'))
const Knowledge = lazy(() => import('./pages/Knowledge'))
const Studio = lazy(() => import('./pages/Studio'))
const Settings = lazy(() => import('./pages/Settings'))

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return <FullPageLoader />
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}

export default function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Public auth routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/library" element={<Library />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
