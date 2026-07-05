import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface GroupSessionData {
  id: string
  title: string
  sector: string
  scheduledAt: string
  duration?: number
  maxStudents: number
  currentEnrollment: number
  isRegistered: boolean
  professional?: {
    firstName: string
    lastName: string
    jobTitle?: string
    sector: string
  }
}

interface BackendGroupSession {
  id: string
  title: string
  sector: string
  scheduledAt: string
  duration: number
  maxStudents: number
  _count: { enrolments: number }
  professional?: {
    id: string
    firstName: string
    lastName: string
    sector: string
    profilePhoto?: string | null
  }
}

interface UseGroupSessionsResult {
  sessions: GroupSessionData[]
  loading: boolean
  error: boolean
}

interface UseGroupSessionsOptions {
  limit?: number
  professionalId?: string
}

const useGroupSessions = (options?: UseGroupSessionsOptions): UseGroupSessionsResult => {
  const { limit, professionalId } = options ?? {}
  const [sessions, setSessions] = useState<GroupSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const params: Record<string, string> = {}
        if (limit) params.limit = String(limit)
        if (professionalId) params.professionalId = professionalId
        const query = new URLSearchParams(params)
        const { data } = await api.get(`/group-sessions?${query}`)
        const raw: BackendGroupSession[] = data.data.sessions ?? data.data
        setSessions(
          raw.map((s) => ({
            id: s.id,
            title: s.title,
            sector: s.sector,
            scheduledAt: s.scheduledAt,
            duration: s.duration,
            maxStudents: s.maxStudents,
            currentEnrollment: s._count.enrolments,
            isRegistered: false,
            professional: s.professional
              ? {
                  firstName: s.professional.firstName,
                  lastName: s.professional.lastName,
                  sector: s.professional.sector,
                }
              : undefined,
          })),
        )
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [limit, professionalId])

  return { sessions, loading, error }
}

export default useGroupSessions
