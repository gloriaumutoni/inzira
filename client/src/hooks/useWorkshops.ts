import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface Workshop {
  id: string
  title: string
  description: string
  sector: string
  format: 'IN_PERSON' | 'ONLINE'
  scheduledAt: string
  duration: number
  location: string | null
  meetingLink: string | null
  maxRegistrations: number | null
  status: string
  company: {
    id: string
    companyName: string
    logoUrl: string | null
  }
  _count: {
    registrations: number
  }
}

interface UseWorkshopsResult {
  workshops: Workshop[]
  loading: boolean
  error: boolean
}

const useWorkshops = (params?: { sector?: string; limit?: number }): UseWorkshopsResult => {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const query = new URLSearchParams({
          upcomingOnly: 'true',
          ...(params?.sector && { sector: params.sector }),
          ...(params?.limit && { limit: String(params.limit) }),
        })
        const { data } = await api.get(`/workshops?${query}`)
        setWorkshops(data.data.workshops ?? data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [params?.sector, params?.limit])

  return { workshops, loading, error }
}

export default useWorkshops
