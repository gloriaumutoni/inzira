import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface Professional {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  isVerified: boolean
  isMentor: boolean
  offersFreeIntro: boolean
  offersProTier: boolean
  offersPremiumTier: boolean
  linkedinUrl: string | null
  averageRating: number | null
  reviewCount: number
}

interface UseProfessionalsResult {
  professionals: Professional[]
  loading: boolean
  error: boolean
}

const useProfessionals = (params?: {
  limit?: number
  sector?: string
  isMentor?: boolean
  combination?: string
}): UseProfessionalsResult => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const query = new URLSearchParams({
          isVerified: 'true',
          isActive: 'true',
          ...(params?.limit && { limit: String(params.limit) }),
          ...(params?.sector && { sector: params.sector }),
        })
        if (params?.isMentor !== undefined) query.set('isMentor', String(params.isMentor))
        if (params?.combination) query.set('combination', params.combination)
        const { data } = await api.get(`/professionals?${query}`)
        setProfessionals(data.data.professionals ?? data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [params?.sector, params?.limit, params?.isMentor, params?.combination])

  return { professionals, loading, error }
}

export default useProfessionals
