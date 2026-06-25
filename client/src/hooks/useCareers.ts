import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { Career } from '@/types'

interface UseCareerResult {
  careers: Career[]
  loading: boolean
  error: boolean
}

const useCareers = (limit = 4): UseCareerResult => {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const { data } = await api.get(`/careers?limit=${limit}&isActive=true`)
        setCareers(data.data.careers)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchCareers()
  }, [limit])

  return { careers, loading, error }
}

export default useCareers
