import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface Professional {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
}

interface UseRecommendedResult {
  professionals: Professional[]
  loading: boolean
  error: boolean
}

const useRecommendedProfessionals = (): UseRecommendedResult => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/professionals/recommended')
        setProfessionals(data.data.professionals)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { professionals, loading, error }
}

export default useRecommendedProfessionals
