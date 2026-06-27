import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { GroupSessionData } from '@/components/sessions/GroupSessionCard'

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

const useGroupSessions = (limit?: number): UseGroupSessionsResult => {
  const [sessions, setSessions] = useState<GroupSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const query = new URLSearchParams(
          limit ? { limit: String(limit) } : {},
        )
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
  }, [limit])

  return { sessions, loading, error }
}

export default useGroupSessions
