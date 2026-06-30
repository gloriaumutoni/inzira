import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface Mentor {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  careers: string[]
}

const useMentors = (params?: { sector?: string; combination?: string }) => {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(false)
      try {
        const query = new URLSearchParams()
        if (params?.sector) query.set('sector', params.sector)
        if (params?.combination) query.set('combination', params.combination)
        const { data } = await api.get(`/professionals/mentors?${query}`)
        setMentors(data.data.mentors)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params?.sector, params?.combination])

  return { mentors, loading, error }
}

export default useMentors
