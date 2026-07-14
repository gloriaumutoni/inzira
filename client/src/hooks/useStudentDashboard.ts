import { useEffect } from 'react'
import { useStudentDashboardQuery } from '@/hooks/queries/studentQueries'
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

interface ConfidenceLogEntry {
  id: string
  score: number
  note: string | null
  createdAt: string
}

export interface StudentDashboardData {
  upcomingSessions: UpcomingSession[]
  groupSessions: GroupSessionEnrolment[]
  latestConfidence: ConfidenceLogEntry | null
}

interface UseStudentDashboardResult {
  dashboard: StudentDashboardData | null
  loading: boolean
  error: boolean
  refetch: () => void
}

const useStudentDashboard = (): UseStudentDashboardResult => {
  const { data, isLoading, isError, refetch } = useStudentDashboardQuery()

  useEffect(() => {
    if (isError) toast.error('Unable to load your dashboard data.')
  }, [isError])

  return {
    dashboard: data ?? null,
    loading: isLoading,
    error: isError,
    refetch: () => { refetch() },
  }
}

export default useStudentDashboard
