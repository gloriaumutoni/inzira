import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types'
import Spinner from '@/components/ui/Spinner'

const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student/home',
  PROFESSIONAL: '/professional/home',
  CAREER_GUIDE: '/career-guide/home',
  ADMIN: '/admin/overview',
}

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: Role
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role !== allowedRole) {
    return <Navigate to={ROLE_HOME[role!]} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
