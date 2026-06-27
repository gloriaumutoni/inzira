import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

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

interface WorkshopRegistration {
  id: string
  registeredAt: string
  workshop: {
    title: string
    scheduledAt: string
    company: { companyName: string }
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
    professional: { firstName: string; lastName: string }
  }
}

interface ConfidenceLog {
  id: string
  score: number
  note: string | null
  createdAt: string
}

interface StudentDashboardData {
  upcomingSessions: UpcomingSession[]
  registeredWorkshops: WorkshopRegistration[]
  groupSessions: GroupSessionEnrolment[]
  latestConfidence: ConfidenceLog | null
}

interface UseStudentDashboardResult {
  dashboard: StudentDashboardData | null
  loading: boolean
  error: boolean
}

const useStudentDashboard = (): UseStudentDashboardResult => {
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/students/me/dashboard')
        setDashboard(data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { dashboard, loading, error }
}

export default useStudentDashboard
