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
  capacity: number
  registrationCount: number
  isPublished: boolean
  createdAt: string
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
        setWorkshops(data.data.workshops ?? data.data)
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
