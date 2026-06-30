import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface PendingCareerGuide {
  id: string
  firstName: string
  lastName: string
  email: string
  school: string
  linkedinUrl: string | null
  submittedAt: string
}

interface UseCareerGuideVerificationResult {
  careerGuides: PendingCareerGuide[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useCareerGuideVerification = (): UseCareerGuideVerificationResult => {
  const [careerGuides, setCareerGuides] = useState<PendingCareerGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(false)
      try {
        const { data } = await api.get('/admin/verification/career-guides')
        setCareerGuides(data.data.careerGuides)
      } catch (err) {
        console.error('useCareerGuideVerification fetch error:', err)
        setError(true)
        toast.error('Unable to load career guide verification queue.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  return { careerGuides, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useCareerGuideVerification
