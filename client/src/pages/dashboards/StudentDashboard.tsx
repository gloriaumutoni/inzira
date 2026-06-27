import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import OLevelDashboard from '@/pages/student/OLevelDashboard'
import ALevelDashboard from '@/pages/student/ALevelDashboard'
import Spinner from '@/components/ui/Spinner'

const StudentDashboard = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  const level = user?.student?.level

  if (level === 'O_LEVEL') return <OLevelDashboard />
  if (level === 'A_LEVEL') return <ALevelDashboard />
  return <Navigate to="/login" replace />
}

export default StudentDashboard
