import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface CompanyWorkshop {
  id: string
  title: string
  description: string
  sector: string
  date: string
  startTime?: string
  endTime?: string
  format: 'IN_PERSON' | 'ONLINE'
  location?: string
  meetingLink?: string
  capacity: number
  registrationCount: number
  isPublished: boolean
  status?: string
  createdAt: string
}

interface RawWorkshop extends Omit<CompanyWorkshop, 'isPublished'> {
  status?: string
  isPublished?: boolean
}

interface UseCompanyWorkshopsResult {
  workshops: CompanyWorkshop[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useCompanyWorkshops = (): UseCompanyWorkshopsResult => {
  const [workshops, setWorkshops] = useState<CompanyWorkshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/workshops/me')
        const raw: RawWorkshop[] = data.data.workshops ?? data.data
        setWorkshops(
          raw.map((w) => ({
            ...w,
            isPublished: w.status === 'ACTIVE' || w.isPublished === true,
          })),
        )
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return { workshops, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useCompanyWorkshops
