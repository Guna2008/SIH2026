import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME_ROUTE } from '../lib/roles'
import LoadingState from '../components/ui/LoadingState'

// Restricts a route subtree to a set of allowed roles.
// This is a UX convenience only — every request the resulting pages make is
// independently authorized by the backend using the role embedded in the JWT.
export default function RoleProtectedRoute({ allow = [] }) {
  const { role, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <LoadingState label="Loading session…" />
      </div>
    )
  }

  if (role === 'ADMIN' || (role && allow.includes(role))) {
    return <Outlet />
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />
  }

  const fallback = ROLE_HOME_ROUTE[role] || '/login'
  return <Navigate to={fallback} replace />
}
