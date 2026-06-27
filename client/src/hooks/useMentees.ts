import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface Mentee {
  id: string
  studentId: string
  plan: 'PRO' | 'PREMIUM'
  startDate: string
  student: {
    firstName: string
    lastName: string
    level: string
    combination?: string
    schoolId?: string
  }
  sessionsCompleted: number
  nextSession?: string
}

interface UseMenteesResult {
  mentees: Mentee[]
  loading: boolean
  error: boolean
}

const useMentees = (): UseMenteesResult => {
  const [mentees, setMentees] = useState<Mentee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/mentorships/students')
        setMentees(data.data.mentees ?? data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { mentees, loading, error }
}

export default useMentees
