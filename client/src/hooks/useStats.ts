import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface PlatformStats {
  students: number
  professionals: number
  mentors: number
  partnerSchools: number
}

interface UseStatsResult {
  stats: PlatformStats | null
  loading: boolean
  error: boolean
}

const useStats = (): UseStatsResult => {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats')
        const raw = data.data
        setStats({
          students: raw.students ?? 0,
          professionals: raw.professionals ?? 0,
          mentors: raw.mentors ?? 0,
          partnerSchools: raw.partnerSchools ?? 0,
        })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, loading, error }
}

export default useStats
