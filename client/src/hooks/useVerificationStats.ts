import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface VerificationStats {
  approvedProfessionals: number
  approvedMentors: number
  approvedCareerGuides: number
}

const useVerificationStats = () => {
  const [stats, setStats] = useState<VerificationStats>({
    approvedProfessionals: 0,
    approvedMentors: 0,
    approvedCareerGuides: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats')
        setStats({
          approvedProfessionals: data.data.approvedProfessionals ?? 0,
          approvedMentors: data.data.approvedMentors ?? 0,
          approvedCareerGuides: data.data.approvedCareerGuides ?? 0,
        })
      } catch {
        // leave defaults
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, loading }
}

export default useVerificationStats
