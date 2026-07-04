import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface PendingProfessional {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  linkedinUrl?: string
  submittedAt: string
  verificationAttempts: number
  rejectionReason: string | null
}

interface UseVerificationResult {
  professionals: PendingProfessional[]
  loading: boolean
  refetch: () => void
}

const useVerification = (): UseVerificationResult => {
  const [professionals, setProfessionals] = useState<PendingProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/admin/verification/professionals')
        const proData = data.data as Array<{
          id: string
          firstName: string
          lastName: string
          jobTitle: string
          employer: string
          sector: string
          bio: string
          linkedinUrl?: string
          createdAt: string
          verificationAttempts: number
          rejectionReason: string | null
          user: { email: string }
        }>
        setProfessionals(
          proData.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.user.email,
            jobTitle: p.jobTitle,
            employer: p.employer,
            sector: p.sector,
            bio: p.bio,
            linkedinUrl: p.linkedinUrl,
            submittedAt: p.createdAt,
            verificationAttempts: p.verificationAttempts ?? 0,
            rejectionReason: p.rejectionReason ?? null,
          })),
        )
      } catch (err) {
        console.error('useVerification fetch error:', err)
        setProfessionals([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return {
    professionals,
    loading,
    refetch: () => setTick((t) => t + 1),
  }
}

export default useVerification
