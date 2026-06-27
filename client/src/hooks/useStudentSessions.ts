import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface StudentSession {
  id: string
  type: 'FREE_INTRO' | 'PRO' | 'PREMIUM'
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
  const [sessions, setSessions] = useState<StudentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        // Sessions list endpoint — returns { sessions, total, page, limit }
        const { data } = await api.get('/sessions')
        setSessions(data.data.sessions ?? data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { sessions, loading, error }
}

export default useStudentSessions
