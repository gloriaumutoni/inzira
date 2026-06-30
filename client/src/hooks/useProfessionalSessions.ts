import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface SessionStudent {
  id: string
  firstName: string
  lastName: string
  level: string
  combination?: string
}

interface ProfessionalSession {
  id: string
  type: 'FREE_INTRO' | 'PRO' | 'PREMIUM'
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DECLINED'
  scheduledAt: string
  duration: number
  student: SessionStudent
  notes?: string
  meetLink?: string
}

interface UseProfessionalSessionsResult {
  sessions: ProfessionalSession[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useProfessionalSessions = (params?: {
  status?: string
  type?: string
}): UseProfessionalSessionsResult => {
  const [sessions, setSessions] = useState<ProfessionalSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams({
          ...(params?.status && { status: params.status }),
          ...(params?.type && { type: params.type }),
        })
        const { data } = await api.get(`/sessions?${query}`)
        setSessions(data.data.sessions ?? data.data)
      } catch {
        setError(true)
        toast.error('Unable to load sessions. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [params?.status, params?.type, tick])

  return { sessions, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useProfessionalSessions
