import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface Professional {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  isVerified: boolean
  offersFreeIntro: boolean
  offersProTier: boolean
  offersPremiumTier: boolean
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
        const { data } = await api.get(`/professionals?${query}`)
        setProfessionals(data.data.professionals ?? data.data)
      } catch (err) {
        console.error('useProfessionals error:', err)
        setError(true)
        toast.error('Unable to load professionals.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [params?.sector, params?.limit])

  return { professionals, loading, error }
}

export default useProfessionals
