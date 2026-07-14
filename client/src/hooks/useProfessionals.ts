import { useProfessionalsQuery } from '@/hooks/queries/studentQueries'

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
  relevantCombinations: string[]
}

interface UseProfessionalsResult {
  professionals: Professional[]
  loading: boolean
  error: boolean
}

const useProfessionals = (params?: {
  limit?: number
  sector?: string
  sectors?: string
  isMentor?: boolean
  combination?: string
}): UseProfessionalsResult => {
  const { data, isLoading, isError } = useProfessionalsQuery(params)

  return {
    professionals: data ?? [],
    loading: isLoading,
    error: isError,
  }
}

export default useProfessionals
