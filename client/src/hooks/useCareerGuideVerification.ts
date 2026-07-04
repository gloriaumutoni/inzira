import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface PendingCareerGuide {
  id: string
  firstName: string
  lastName: string
  email: string
  school: string | null
  linkedinUrl: string | null
  submittedAt: string
  rejectionCount: number
  rejectionReason: string | null
}

interface UseCareerGuideVerificationResult {
  careerGuides: PendingCareerGuide[]
  loading: boolean
  refetch: () => void
}

const useCareerGuideVerification = (): UseCareerGuideVerificationResult => {
  const [careerGuides, setCareerGuides] = useState<PendingCareerGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/admin/verification/career-guides')
        const raw = data.data as Array<{
          id: string
          firstName: string
          lastName: string
          linkedinUrl: string | null
          createdAt: string
          rejectionCount: number
          rejectionReason: string | null
          school: { name: string } | null
          user: { email: string }
        }>
        setCareerGuides(
          raw.map((cg) => ({
            id: cg.id,
            firstName: cg.firstName,
            lastName: cg.lastName,
            email: cg.user.email,
            school: cg.school?.name ?? null,
            linkedinUrl: cg.linkedinUrl,
            submittedAt: cg.createdAt,
            rejectionCount: cg.rejectionCount ?? 0,
            rejectionReason: cg.rejectionReason ?? null,
          })),
        )
      } catch (err) {
        console.error('useCareerGuideVerification fetch error:', err)
        setCareerGuides([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return { careerGuides, loading, refetch: () => setTick((t) => t + 1) }
}

export default useCareerGuideVerification
