import { toast } from '@/utils/toast'
import { useEffect } from 'react'
import { useStudentSessionsQuery } from '@/hooks/queries/studentQueries'

export interface StudentSession {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  scheduledAt: string
  duration: number
  professional?: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string
    sector?: string
  }
}

interface UseStudentSessionsResult {
  sessions: StudentSession[]
  loading: boolean
  error: boolean
}

const useStudentSessions = (): UseStudentSessionsResult => {
  const { data, isLoading, isError } = useStudentSessionsQuery()

  useEffect(() => {
    if (isError) toast.error('Unable to load sessions. Please try again.')
  }, [isError])

  return {
    sessions: data ?? [],
    loading: isLoading,
    error: isError,
  }
}

export default useStudentSessions
