import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface PendingProfessional {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  linkedinUrl: string | null
  submittedAt: string
}

interface UseVerificationResult {
  professionals: PendingProfessional[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useVerification = (): UseVerificationResult => {
  const [professionals, setProfessionals] = useState<PendingProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(false)
      try {
        const { data } = await api.get('/admin/verification/professionals')
        setProfessionals(data.data.professionals)
      } catch (err) {
        console.error('useVerification fetch error:', err)
        setError(true)
        toast.error('Unable to load verification queue.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  return { professionals, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useVerification
