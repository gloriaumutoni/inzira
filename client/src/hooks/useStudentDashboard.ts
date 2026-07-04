import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface UpcomingSession {
  id: string
  status: string
  scheduledAt: string
  duration: number
  professional: {
    firstName: string
    lastName: string
    jobTitle: string
    sector: string
  }
}

interface GroupSessionEnrolment {
  id: string
  joinedAt: string
  groupSession: {
    id: string
    title: string
    scheduledAt: string
    sector: string
    joinLink?: string | null
    professional: { firstName: string; lastName: string; jobTitle: string }
  }
}

interface StudentDashboardData {
  upcomingSessions: UpcomingSession[]
  groupSessions: GroupSessionEnrolment[]
  latestConfidence: number | null
}

interface UseStudentDashboardResult {
  dashboard: StudentDashboardData | null
  loading: boolean
  error: boolean
  refetch: () => void
}

const useStudentDashboard = (): UseStudentDashboardResult => {
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/students/me/dashboard')
        setDashboard(data.data)
      } catch {
        setError(true)
        toast.error('Unable to load your dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  const refetch = () => setTick((t) => t + 1)

  return { dashboard, loading, error, refetch }
}

export default useStudentDashboard
