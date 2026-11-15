import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../stores/AuthStore'
import PageNotFound from '../components/ui/PageNotFound'

const RootLayout = () => (
  <>
    <Outlet />
  </>
)

export const Route = createRootRoute({ 
  beforeLoad: ({location}) => {
    const token = useAuthStore.getState().token

    const isPublicRoute = location.pathname === '/login' || location.pathname === '/register'

    if (!isPublicRoute && !token) {
      throw redirect({to: '/login'})
    }
  },
  component: RootLayout,
  notFoundComponent: PageNotFound})