import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import { Career } from '@/types'

interface UseCareerResult {
  careers: Career[]
  loading: boolean
  error: boolean
}

const useCareers = (params?: {
  limit?: number
  sector?: string
  combination?: string
}): UseCareerResult => {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const query = new URLSearchParams({
          isActive: 'true',
          ...(params?.limit && { limit: String(params.limit) }),
          ...(params?.sector && { sector: params.sector }),
          ...(params?.combination && { combination: params.combination }),
        })
        const { data } = await api.get(`/careers?${query}`)
        setCareers(data.data.careers ?? data.data)
      } catch {
        setError(true)
        toast.error('Unable to load careers.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [params?.sector, params?.combination, params?.limit])

  return { careers, loading, error }
}

export default useCareers
